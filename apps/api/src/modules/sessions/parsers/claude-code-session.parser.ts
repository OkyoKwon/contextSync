import type { SessionImportData } from '@context-sync/shared';
import { findFirstMeaningfulTitle, generateTitle, stripSystemXmlContent, UNTITLED } from './title.utils.js';

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
  return (usage.input_tokens ?? 0)
    + (usage.output_tokens ?? 0)
    + (usage.cache_creation_input_tokens ?? 0)
    + (usage.cache_read_input_tokens ?? 0);
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

export function parseClaudeCodeSession(raw: string): ClaudeCodeParseResult {
  const lines = raw.trim().split('\n').filter(Boolean);
  const messages: SessionImportData['messages'][number][] = [];
  const filePaths = new Set<string>();
  let model: string | undefined;
  let branch: string | undefined;

  let currentRequestId: string | undefined;
  let pendingTurn: PendingAssistantTurn | undefined;

  const flushPendingTurn = () => {
    if (!pendingTurn) return;

    const content = pendingTurn.textParts.length > 0
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

    if (record.type === 'user' && typeof record.message?.content === 'string') {
      const cleaned = stripSystemXmlContent(record.message.content);
      if (cleaned) {
        flushPendingTurn();
        messages.push({
          role: 'user',
          content: cleaned,
          contentType: 'prompt',
        });
      }
    }

    if (record.type === 'assistant' && Array.isArray(record.message?.content)) {
      const reqId = record.requestId;

      // New request → flush previous turn
      if (reqId && reqId !== currentRequestId) {
        flushPendingTurn();
        currentRequestId = reqId;
        pendingTurn = { textParts: [], toolNames: [], model: undefined, usage: undefined, timestamp: undefined };
      } else if (!pendingTurn) {
        // No requestId or first record — start a new turn
        pendingTurn = { textParts: [], toolNames: [], model: undefined, usage: undefined, timestamp: undefined };
      }

      const blocks = record.message.content as readonly ClaudeContentBlock[];
      for (const block of blocks) {
        if (block.type === 'text' && block.text) pendingTurn.textParts.push(block.text);
        if (block.type === 'tool_use' && block.name) pendingTurn.toolNames.push(block.name);
      }
      if (record.message.model) pendingTurn.model = record.message.model;
      if (record.message.usage) pendingTurn.usage = record.message.usage;
    }

    if (record.snapshot?.trackedFileBackups) {
      for (const path of Object.keys(record.snapshot.trackedFileBackups)) {
        filePaths.add(path);
      }
    }

    if ('gitBranch' in record && typeof (record as Record<string, unknown>)['gitBranch'] === 'string') {
      branch = String((record as Record<string, unknown>)['gitBranch']);
    }
  }

  flushPendingTurn();

  if (messages.length === 0) {
    throw new Error('No conversation messages found in Claude Code session');
  }

  const userContents = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content);
  const title = findFirstMeaningfulTitle(userContents);

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

export interface TimestampedMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly timestamp: string;
  readonly modelUsed?: string;
  readonly tokensUsed?: number;
}

export interface TimestampedParseResult {
  readonly title: string;
  readonly branch?: string;
  readonly messages: readonly TimestampedMessage[];
  readonly filePaths: readonly string[];
}

export function parseClaudeCodeSessionWithTimestamps(raw: string): TimestampedParseResult {
  const lines = raw.trim().split('\n').filter(Boolean);
  const messages: TimestampedMessage[] = [];
  const filePaths = new Set<string>();
  let model: string | undefined;
  let branch: string | undefined;
  let lastTimestamp: string = new Date(0).toISOString();

  let currentRequestId: string | undefined;
  let pendingTurn: PendingAssistantTurn | undefined;

  const flushPendingTurn = () => {
    if (!pendingTurn) return;

    const content = pendingTurn.textParts.length > 0
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
        timestamp: pendingTurn.timestamp ?? lastTimestamp,
        modelUsed: turnModel,
        tokensUsed: tokensUsed || undefined,
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

    if (record.type === 'user' && typeof record.message?.content === 'string') {
      const cleaned = stripSystemXmlContent(record.message.content);
      if (cleaned) {
        flushPendingTurn();
        messages.push({
          role: 'user',
          content: cleaned,
          timestamp: lastTimestamp,
        });
      }
    }

    if (record.type === 'assistant' && Array.isArray(record.message?.content)) {
      const reqId = record.requestId;

      if (reqId && reqId !== currentRequestId) {
        flushPendingTurn();
        currentRequestId = reqId;
        pendingTurn = { textParts: [], toolNames: [], model: undefined, usage: undefined, timestamp: lastTimestamp };
      } else if (!pendingTurn) {
        pendingTurn = { textParts: [], toolNames: [], model: undefined, usage: undefined, timestamp: lastTimestamp };
      }

      const blocks = record.message.content as readonly ClaudeContentBlock[];
      for (const block of blocks) {
        if (block.type === 'text' && block.text) pendingTurn.textParts.push(block.text);
        if (block.type === 'tool_use' && block.name) pendingTurn.toolNames.push(block.name);
      }
      if (record.message.model) pendingTurn.model = record.message.model;
      if (record.message.usage) pendingTurn.usage = record.message.usage;
      pendingTurn.timestamp = lastTimestamp;
    }

    if (record.snapshot?.trackedFileBackups) {
      for (const path of Object.keys(record.snapshot.trackedFileBackups)) {
        filePaths.add(path);
      }
    }

    if ('gitBranch' in record && typeof (record as Record<string, unknown>)['gitBranch'] === 'string') {
      branch = String((record as Record<string, unknown>)['gitBranch']);
    }
  }

  flushPendingTurn();

  const userContents = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content);
  const title = findFirstMeaningfulTitle(userContents);

  return {
    title,
    branch,
    messages,
    filePaths: [...filePaths],
  };
}

export function previewClaudeCodeSession(raw: string, maxLines = 200): {
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

    if (record.type === 'user' && typeof record.message?.content === 'string') {
      const cleaned = stripSystemXmlContent(record.message.content);
      if (cleaned) {
        if (!firstMessage || firstMessage === UNTITLED) {
          firstMessage = generateTitle(record.message.content);
        }
        messageCount++;
      }
    }

    if (record.type === 'assistant' && Array.isArray(record.message?.content)) {
      const hasText = (record.message.content as readonly ClaudeContentBlock[])
        .some((block) => block.type === 'text' && block.text);
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

      if (record.type === 'user' && typeof record.message?.content === 'string') {
        const cleaned = stripSystemXmlContent(record.message.content);
        if (cleaned) {
          messageCount++;
        }
      }

      if (record.type === 'assistant' && Array.isArray(record.message?.content)) {
        const hasText = (record.message.content as readonly ClaudeContentBlock[])
          .some((block) => block.type === 'text' && block.text);
        if (hasText) {
          messageCount++;
        }
      }
    }
  }

  return { firstMessage: firstMessage || 'Empty session', messageCount, startedAt };
}
