import type { Session, Message } from '@context-sync/shared';

export function formatExportDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function roleHeading(role: string): string {
  const map: Record<string, string> = {
    user: 'User',
    human: 'User',
    assistant: 'Assistant',
  };
  return map[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
}

export function sessionToMarkdown(session: Session, messages: readonly Message[]): string {
  const lines: string[] = [];

  lines.push(`## ${session.title}`);
  lines.push('');
  lines.push(`- **Date**: ${formatExportDate(session.createdAt)}`);
  if (session.source) lines.push(`- **Source**: ${session.source}`);
  if (session.branch) lines.push(`- **Branch**: ${session.branch}`);
  if (session.filePaths.length > 0) {
    lines.push(`- **Files**: ${session.filePaths.join(', ')}`);
  }
  lines.push('');

  for (const msg of messages) {
    lines.push(`### ${roleHeading(msg.role)}`);
    lines.push('');
    lines.push(msg.content);
    lines.push('');
  }

  return lines.join('\n');
}
