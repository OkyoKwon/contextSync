import type { SessionImportData } from '@context-sync/shared';
import {
  generateSessionTitle,
  generateTitle,
  stripSystemXmlContent,
  UNTITLED,
} from './title.utils.js';
export type {
  TimestampedMessage,
  TimestampedParseResult,
} from './claude-code-session-timestamps.parser.js';
export { parseClaudeCodeSessionWithTimestamps } from './claude-code-session-timestamps.parser.js';

interface ClaudeUsage {
  readonly input_tokens?: number;
  readonly output_tokens?: number;
  readonly cache_creation_input_tokens?: number;
  readonly cache_read_input_tokens?: number;
}

interface ClaudeCodeRecord {
  readonly type?: string;
  readonly requestId?: string;
  readonly message?: {
    readonly role?: string;
    readonly content?: string | readonly ClaudeContentBlock[];
    readonly model?: string;
    readonly usage?: ClaudeUsage;
  };
  readonly snapshot?: {
    readonly trackedFileBackups?: Readonly<Record<string, unknown>>;
  };
}

function sumUsageTokens(usage: ClaudeUsage): number {
  return (
    (usage.input_tokens ?? 0) +
    (usage.output_tokens ?? 0) +
    (usage.cache_creation_input_tokens ?? 0) +
    (usage.cache_read_input_tokens ?? 0)
  );
}

interface PendingAssistantTurn {
  textParts: string[];
  toolNames: string[];
  model: string | undefined;
  usage: ClaudeUsage | undefined;
  timestamp: string | undefined;
}

interface ClaudeContentBlock {
  readonly type: string;
  readonly text?: string;
  readonly name?: string;
}

export interface ClaudeCodeParseResult {
  readonly parsed: SessionImportData;
  readonly filePaths: readonly string[];
}

function extractUserText(content: string | readonly ClaudeContentBlock[]): string {
  if (typeof content === 'string') return content;
  return content
    .filter(
      (block): block is ClaudeContentBlock & { text: string } =>
        block.type === 'text' && typeof block.text === 'string',
    )
    .map((block) => block.text)
    .join('\n\n');
}

export function parseClaudeCodeSession(raw: string): ClaudeCodeParseResult {
  const lines = raw.trim().split('\n').filter(Boolean);
  const messages: SessionImportData['messages'][number][] = [];
  const filePaths = new Set<string>();
  const allToolNames: string[] = [];
  let model: string | undefined;
  let branch: string | undefined;

  let currentRequestId: string | undefined;
  let pendingTurn: PendingAssistantTurn | undefined;
  let lastTimestamp: string | undefined;

  const flushPendingTurn = () => {
    if (!pendingTurn) return;

    if (pendingTurn.toolNames.length > 0) {
      allToolNames.push(...pendingTurn.toolNames);
    }

    const content =
      pendingTurn.textParts.length > 0
        ? pendingTurn.textParts.join('\n\n')
        : pendingTurn.toolNames.length > 0
          ? `[Tool use: ${pendingTurn.toolNames.join(', ')}]`
          : null;

    if (content) {
      const turnModel = pendingTurn.model ?? model;
      const tokensUsed = pendingTurn.usage ? sumUsageTokens(pendingTurn.usage) : undefined;

      messages.push({
        role: 'assistant',
        content,
        contentType: 'response',
        modelUsed: turnModel,
        tokensUsed: tokensUsed || undefined,
        timestamp: pendingTurn.timestamp,
      });

      if (pendingTurn.model) {
        model = pendingTurn.model;
      }
    }

    pendingTurn = undefined;
    currentRequestId = undefined;
  };

  for (const line of lines) {
    let record: ClaudeCodeRecord;
    try {
      record = JSON.parse(line) as ClaudeCodeRecord;
    } catch {
      continue;
    }

    if ('timestamp' in record && (record as Record<string, unknown>)['timestamp']) {
      lastTimestamp = String((record as Record<string, unknown>)['timestamp']);
    }

    if (record.type === 'user' && record.message?.content != null) {
      const rawText = extractUserText(record.message.content);
      const cleaned = stripSystemXmlContent(rawText);
      if (cleaned) {
        flushPendingTurn();
        messages.push({
          role: 'user',
          content: cleaned,
          contentType: 'prompt',
          timestamp: lastTimestamp,
        });
      }
    }

    if (record.type === 'assistant' && Array.isArray(record.message?.content)) {
      const reqId = record.requestId;

      // New request → flush previous turn
      if (reqId && reqId !== currentRequestId) {
        flushPendingTurn();
        currentRequestId = reqId;
        pendingTurn = {
          textParts: [],
          toolNames: [],
          model: undefined,
          usage: undefined,
          timestamp: lastTimestamp,
        };
      } else if (!pendingTurn) {
        // No requestId or first record — start a new turn
        pendingTurn = {
          textParts: [],
          toolNames: [],
          model: undefined,
          usage: undefined,
          timestamp: lastTimestamp,
        };
      }

      const blocks = record.message.content as readonly ClaudeContentBlock[];
      for (const block of blocks) {
        if (block.type === 'text' && block.text) pendingTurn.textParts.push(block.text);
        if (block.type === 'tool_use' && block.name) pendingTurn.toolNames.push(block.name);
      }
      if (record.message.model) pendingTurn.model = record.message.model;
      if (record.message.usage) pendingTurn.usage = record.message.usage;
      if (lastTimestamp) pendingTurn.timestamp = lastTimestamp;
    }

    if (record.snapshot?.trackedFileBackups) {
      for (const path of Object.keys(record.snapshot.trackedFileBackups)) {
        filePaths.add(path);
      }
    }

    if (
      'gitBranch' in record &&
      typeof (record as Record<string, unknown>)['gitBranch'] === 'string'
    ) {
      branch = String((record as Record<string, unknown>)['gitBranch']);
    }
  }

  flushPendingTurn();

  if (messages.length === 0) {
    throw new Error('No conversation messages found in Claude Code session');
  }

  const title = generateSessionTitle({
    userMessages: messages.filter((m) => m.role === 'user').map((m) => m.content),
    assistantMessages: messages.filter((m) => m.role === 'assistant').map((m) => m.content),
    branch,
    filePaths: [...filePaths],
    toolNames: allToolNames,
  });

  return {
    parsed: {
      title,
      source: 'claude_code',
      branch,
      messages,
    },
    filePaths: [...filePaths],
  };
}

export function previewClaudeCodeSession(
  raw: string,
  maxLines = 200,
): {
  readonly firstMessage: string;
  readonly messageCount: number;
  readonly startedAt: string | undefined;
} {
  const lines = raw.trim().split('\n').filter(Boolean);
  const linesToScan = lines.slice(0, maxLines);

  let firstMessage = '';
  let messageCount = 0;
  let startedAt: string | undefined;

  for (const line of linesToScan) {
    let record: ClaudeCodeRecord;
    try {
      record = JSON.parse(line) as ClaudeCodeRecord;
    } catch {
      continue;
    }

    if (!startedAt && 'timestamp' in record) {
      startedAt = String((record as Record<string, unknown>)['timestamp']);
    }

    if (record.type === 'user' && record.message?.content != null) {
      const rawText = extractUserText(record.message.content);
      const cleaned = stripSystemXmlContent(rawText);
      if (cleaned) {
        if (!firstMessage || firstMessage === UNTITLED) {
          firstMessage = generateTitle(rawText);
        }
        messageCount++;
      }
    }

    if (record.type === 'assistant' && Array.isArray(record.message?.content)) {
      const hasText = (record.message.content as readonly ClaudeContentBlock[]).some(
        (block) => block.type === 'text' && block.text,
      );
      if (hasText) {
        messageCount++;
      }
    }
  }

  // If we only scanned partial lines, scan the rest for counts
  if (lines.length > maxLines) {
    for (const line of lines.slice(maxLines)) {
      let record: ClaudeCodeRecord;
      try {
        record = JSON.parse(line) as ClaudeCodeRecord;
      } catch {
        continue;
      }

      if (record.type === 'user' && record.message?.content != null) {
        const rawText = extractUserText(record.message.content);
        const cleaned = stripSystemXmlContent(rawText);
        if (cleaned) {
          messageCount++;
        }
      }

      if (record.type === 'assistant' && Array.isArray(record.message?.content)) {
        const hasText = (record.message.content as readonly ClaudeContentBlock[]).some(
          (block) => block.type === 'text' && block.text,
        );
        if (hasText) {
          messageCount++;
        }
      }
    }
  }

  return { firstMessage: firstMessage || 'Empty session', messageCount, startedAt };
}
