import type { SessionImportData } from '@context-sync/shared';

interface ClaudeCodeRecord {
  readonly type?: string;
  readonly message?: {
    readonly role?: string;
    readonly content?: string | readonly ClaudeContentBlock[];
    readonly model?: string;
    readonly usage?: {
      readonly input_tokens?: number;
      readonly output_tokens?: number;
    };
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
  let firstTimestamp: string | undefined;

  for (const line of lines) {
    let record: ClaudeCodeRecord;
    try {
      record = JSON.parse(line) as ClaudeCodeRecord;
    } catch {
      continue;
    }

    if (!firstTimestamp && 'timestamp' in record) {
      firstTimestamp = String((record as Record<string, unknown>)['timestamp']);
    }

    if (record.type === 'user' && typeof record.message?.content === 'string') {
      messages.push({
        role: 'user',
        content: record.message.content,
        contentType: 'prompt',
      });
    }

    if (record.type === 'assistant' && Array.isArray(record.message?.content)) {
      const textBlocks = (record.message.content as readonly ClaudeContentBlock[])
        .filter((block) => block.type === 'text' && block.text);

      if (textBlocks.length > 0) {
        const content = textBlocks.map((block) => block.text!).join('\n\n');
        messages.push({
          role: 'assistant',
          content,
          contentType: 'response',
          modelUsed: record.message.model ?? model,
          tokensUsed: record.message.usage
            ? (record.message.usage.input_tokens ?? 0) + (record.message.usage.output_tokens ?? 0)
            : undefined,
        });

        if (record.message.model) {
          model = record.message.model;
        }
      }
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

  if (messages.length === 0) {
    throw new Error('No conversation messages found in Claude Code session');
  }

  const firstUserMsg = messages.find((m) => m.role === 'user');
  const title = firstUserMsg
    ? firstUserMsg.content.slice(0, 100).replace(/\n/g, ' ').trim()
    : 'Untitled Session';

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
      messages.push({
        role: 'user',
        content: record.message.content,
        timestamp: lastTimestamp,
      });
    }

    if (record.type === 'assistant' && Array.isArray(record.message?.content)) {
      const textBlocks = (record.message.content as readonly ClaudeContentBlock[])
        .filter((block) => block.type === 'text' && block.text);

      if (textBlocks.length > 0) {
        const content = textBlocks.map((block) => block.text!).join('\n\n');
        messages.push({
          role: 'assistant',
          content,
          timestamp: lastTimestamp,
          modelUsed: record.message.model ?? model,
          tokensUsed: record.message.usage
            ? (record.message.usage.input_tokens ?? 0) + (record.message.usage.output_tokens ?? 0)
            : undefined,
        });

        if (record.message.model) {
          model = record.message.model;
        }
      }
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

  const firstUserMsg = messages.find((m) => m.role === 'user');
  const title = firstUserMsg
    ? firstUserMsg.content.slice(0, 100).replace(/\n/g, ' ').trim()
    : 'Untitled Session';

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
      if (!firstMessage) {
        firstMessage = record.message.content.slice(0, 100).replace(/\n/g, ' ').trim();
      }
      messageCount++;
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
        messageCount++;
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
