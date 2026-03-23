import { generateSessionTitle, stripSystemXmlContent } from './title.utils.js';

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

interface ClaudeContentBlock {
  readonly type: string;
  readonly text?: string;
  readonly name?: string;
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

export function parseClaudeCodeSessionWithTimestamps(raw: string): TimestampedParseResult {
  const lines = raw.trim().split('\n').filter(Boolean);
  const messages: TimestampedMessage[] = [];
  const filePaths = new Set<string>();
  const allToolNames: string[] = [];
  let model: string | undefined;
  let branch: string | undefined;
  let lastTimestamp: string = new Date(0).toISOString();

  let currentRequestId: string | undefined;
  let pendingTurn: PendingAssistantTurn | undefined;

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

    if (record.type === 'user' && record.message?.content != null) {
      const rawText = extractUserText(record.message.content);
      const cleaned = stripSystemXmlContent(rawText);
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
        pendingTurn = {
          textParts: [],
          toolNames: [],
          model: undefined,
          usage: undefined,
          timestamp: lastTimestamp,
        };
      } else if (!pendingTurn) {
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
      pendingTurn.timestamp = lastTimestamp;
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

  const title = generateSessionTitle({
    userMessages: messages.filter((m) => m.role === 'user').map((m) => m.content),
    assistantMessages: messages.filter((m) => m.role === 'assistant').map((m) => m.content),
    branch,
    filePaths: [...filePaths],
    toolNames: allToolNames,
  });

  return {
    title,
    branch,
    messages,
    filePaths: [...filePaths],
  };
}
