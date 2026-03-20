import type { Db } from '../../database/client.js';
import type { Session, Message } from '@context-sync/shared';
import { assertProjectAccess } from '../projects/project.service.js';
import { findAllSessionsWithMessages } from './session.repository.js';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function roleHeading(role: string): string {
  const map: Record<string, string> = {
    user: 'User',
    human: 'User',
    assistant: 'Assistant',
  };
  return map[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
}

function sessionToMarkdown(session: Session, messages: readonly Message[]): string {
  const lines: string[] = [];

  lines.push(`## ${session.title}`);
  lines.push('');
  lines.push(`- **Date**: ${formatDate(session.createdAt)}`);
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

export async function exportProjectAsMarkdown(
  db: Db,
  projectId: string,
  userId: string,
): Promise<{ markdown: string; projectName: string }> {
  const project = await assertProjectAccess(db, projectId, userId);
  const sessionsWithMessages = await findAllSessionsWithMessages(db, projectId);

  const lines: string[] = [];
  lines.push(`# ${project.name} — Sessions Export`);
  lines.push('');
  lines.push(`> Exported at ${formatDate(new Date().toISOString())}`);
  lines.push('');

  if (sessionsWithMessages.length === 0) {
    lines.push('_No sessions found._');
    lines.push('');
  } else {
    for (const { session, messages } of sessionsWithMessages) {
      lines.push('---');
      lines.push('');
      lines.push(sessionToMarkdown(session, messages));
    }
  }

  return {
    markdown: lines.join('\n'),
    projectName: project.name,
  };
}
