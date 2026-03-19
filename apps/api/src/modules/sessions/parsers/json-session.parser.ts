import type { SessionImportData } from '@context-sync/shared';

interface RawJsonSession {
  readonly title?: string;
  readonly conversation?: readonly RawMessage[];
  readonly messages?: readonly RawMessage[];
  readonly source?: string;
  readonly branch?: string;
  readonly tags?: readonly string[];
}

interface RawMessage {
  readonly role: string;
  readonly content: string;
  readonly type?: string;
  readonly contentType?: string;
  readonly tokens_used?: number;
  readonly tokensUsed?: number;
  readonly model?: string;
  readonly modelUsed?: string;
}

export function parseJsonSession(raw: string): SessionImportData {
  const data = JSON.parse(raw) as RawJsonSession;
  const messages = data.messages ?? data.conversation ?? [];

  if (!messages.length) {
    throw new Error('No messages found in JSON data');
  }

  const title = data.title ?? deriveTitle(messages);

  return {
    title,
    source: data.source,
    branch: data.branch,
    tags: data.tags,
    messages: messages.map((msg) => ({
      role: normalizeRole(msg.role),
      content: msg.content,
      contentType: msg.contentType ?? msg.type ?? (msg.role === 'user' ? 'prompt' : 'response'),
      tokensUsed: msg.tokensUsed ?? msg.tokens_used,
      modelUsed: msg.modelUsed ?? msg.model,
    })),
  };
}

export function parseJsonlSession(raw: string): SessionImportData {
  const lines = raw.trim().split('\n').filter(Boolean);
  const messages = lines.map((line) => {
    const parsed = JSON.parse(line) as RawMessage;
    return {
      role: normalizeRole(parsed.role),
      content: parsed.content,
      contentType: parsed.contentType ?? parsed.type ?? (parsed.role === 'user' ? 'prompt' : 'response'),
      tokensUsed: parsed.tokensUsed ?? parsed.tokens_used,
      modelUsed: parsed.modelUsed ?? parsed.model,
    };
  });

  if (!messages.length) {
    throw new Error('No messages found in JSONL data');
  }

  return {
    title: deriveTitle(messages),
    messages,
  };
}

export function extractFilePathsFromMessages(
  messages: readonly { readonly content: string }[],
): readonly string[] {
  const pathPattern = /(?:^|\s|['"`])([a-zA-Z0-9_./-]+\.[a-zA-Z]{1,10})(?:['"`]|\s|$|:)/gm;
  const paths = new Set<string>();

  for (const msg of messages) {
    let match: RegExpExecArray | null;
    while ((match = pathPattern.exec(msg.content)) !== null) {
      const path = match[1];
      if (path && isLikelyFilePath(path)) {
        paths.add(path);
      }
    }
  }

  return [...paths];
}

function isLikelyFilePath(candidate: string | undefined): boolean {
  if (!candidate) return false;
  const codeExtensions = /\.(ts|tsx|js|jsx|py|go|rs|java|rb|css|scss|html|json|yaml|yml|toml|md|sql|sh)$/;
  return codeExtensions.test(candidate) && candidate.includes('/');
}

function normalizeRole(role: string): string {
  if (role === 'human' || role === 'user') return 'user';
  if (role === 'ai' || role === 'assistant' || role === 'bot') return 'assistant';
  return role;
}

function deriveTitle(messages: readonly { readonly content: string }[]): string {
  const firstUserMsg = messages.find((m) => m.content && m.content.length > 0);
  if (firstUserMsg) {
    return firstUserMsg.content.slice(0, 100).replace(/\n/g, ' ').trim();
  }
  return 'Untitled Session';
}
