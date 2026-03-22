import type { Db } from '../../database/client.js';
import { assertProjectAccess } from '../projects/project.service.js';
import { findAllSessionsWithMessages } from './session.repository.js';
import { formatExportDate, sessionToMarkdown } from './session-export.helpers.js';

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
  lines.push(`> Exported at ${formatExportDate(new Date().toISOString())}`);
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
