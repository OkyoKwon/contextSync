import type { SessionImportData } from '@context-sync/shared';

interface ParsedBlock {
  readonly role: string;
  readonly content: string;
}

export function parseMarkdownSession(raw: string): SessionImportData {
  const blocks = splitByRoleHeaders(raw);

  if (!blocks.length) {
    throw new Error('No conversation blocks found in Markdown');
  }

  const title = deriveMarkdownTitle(raw, blocks);

  return {
    title,
    messages: blocks.map((block) => ({
      role: block.role,
      content: block.content.trim(),
      contentType: block.role === 'user' ? 'prompt' : 'response',
    })),
  };
}

function splitByRoleHeaders(raw: string): readonly ParsedBlock[] {
  const headerPattern = /^##\s+(User|Human|Assistant|AI|Bot)\s*$/gim;
  const blocks: ParsedBlock[] = [];
  const matches: { role: string; index: number }[] = [];

  let match: RegExpExecArray | null;
  while ((match = headerPattern.exec(raw)) !== null) {
    matches.push({
      role: normalizeRole(match[1] ?? ''),
      index: match.index + match[0].length,
    });
  }

  if (matches.length === 0) {
    return parseFallbackFormat(raw);
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]!;
    const next = matches[i + 1];
    const endIndex = next ? raw.lastIndexOf('##', next.index) : raw.length;
    const blockContent = raw.slice(current.index, endIndex);

    blocks.push({ role: current.role, content: blockContent.trim() });
  }

  return blocks;
}

function parseFallbackFormat(raw: string): readonly ParsedBlock[] {
  const lines = raw.split('\n');
  const blocks: ParsedBlock[] = [];
  let currentRole = 'user';
  let currentContent: string[] = [];

  for (const line of lines) {
    const roleMatch = /^(?:\*\*|__)?(User|Human|Assistant|AI|Bot)(?:\*\*|__)?:\s*/i.exec(line);
    if (roleMatch) {
      if (currentContent.length > 0) {
        blocks.push({ role: currentRole, content: currentContent.join('\n').trim() });
      }
      currentRole = normalizeRole(roleMatch[1] ?? '');
      currentContent = [line.slice(roleMatch[0].length)];
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    blocks.push({ role: currentRole, content: currentContent.join('\n').trim() });
  }

  return blocks.filter((b) => b.content.length > 0);
}

function normalizeRole(role: string): string {
  const lower = role.toLowerCase();
  if (lower === 'human' || lower === 'user') return 'user';
  if (lower === 'ai' || lower === 'assistant' || lower === 'bot') return 'assistant';
  return lower;
}

function deriveMarkdownTitle(raw: string, blocks: readonly ParsedBlock[]): string {
  const h1Match = /^#\s+(.+)$/m.exec(raw);
  if (h1Match) return h1Match[1]!.trim().slice(0, 100);

  const first = blocks[0];
  if (first) return first.content.slice(0, 100).replace(/\n/g, ' ').trim();

  return 'Untitled Session';
}
