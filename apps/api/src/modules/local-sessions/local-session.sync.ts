import { readFile } from 'node:fs/promises';
import { sql } from 'kysely';
import type { Db } from '../../database/client.js';
import type {
  SyncSessionResult,
  SyncSingleResult,
  RecalculateTokenResult,
} from '@context-sync/shared';
import { parseClaudeCodeSession } from '../sessions/parsers/claude-code-session.parser.js';
import { importParsedSession } from '../sessions/session-import.service.js';
import { assertProjectAccess } from '../projects/project.service.js';
import { findSessionFiles, type SessionFile } from './local-session.service.js';

export async function getProjectSessionFiles(
  db: Db,
  projectId: string,
): Promise<readonly SessionFile[]> {
  const project = await db
    .selectFrom('projects')
    .select(['local_directory', 'owner_id'])
    .where('id', '=', projectId)
    .executeTakeFirst();

  const directoriesToScan: string[] = [];
  if (project?.local_directory) {
    directoriesToScan.push(project.local_directory);
  }

  const collabRows = await db
    .selectFrom('project_collaborators')
    .select(['local_directory'])
    .where('project_id', '=', projectId)
    .where('local_directory', 'is not', null)
    .execute();

  for (const row of collabRows) {
    if (row.local_directory) {
      directoriesToScan.push(row.local_directory);
    }
  }

  if (directoriesToScan.length === 0) return [];

  const encodedDirs = new Set(directoriesToScan.map(encodeProjectPath));

  const allSessionFiles = await findSessionFiles();
  return allSessionFiles.filter((f) => encodedDirs.has(f.dir));
}

function encodeProjectPath(absolutePath: string): string {
  return absolutePath.replace(/\//g, '-');
}

export interface DirectoryOwner {
  readonly name: string;
  readonly avatarUrl: string | null;
}

export async function getProjectDirectoryOwners(
  db: Db,
  projectId: string,
): Promise<ReadonlyMap<string, DirectoryOwner>> {
  const owners = new Map<string, DirectoryOwner>();

  // Owner's directory
  const ownerRow = await db
    .selectFrom('projects')
    .innerJoin('users', 'users.id', 'projects.owner_id')
    .select(['projects.local_directory', 'users.name', 'users.avatar_url'])
    .where('projects.id', '=', projectId)
    .executeTakeFirst();

  if (ownerRow?.local_directory) {
    owners.set(ownerRow.local_directory, {
      name: ownerRow.name,
      avatarUrl: ownerRow.avatar_url,
    });
  }

  // Collaborators' directories
  const collabRows = await db
    .selectFrom('project_collaborators')
    .innerJoin('users', 'users.id', 'project_collaborators.user_id')
    .select(['project_collaborators.local_directory', 'users.name', 'users.avatar_url'])
    .where('project_collaborators.project_id', '=', projectId)
    .where('project_collaborators.local_directory', 'is not', null)
    .execute();

  for (const row of collabRows) {
    if (row.local_directory) {
      owners.set(row.local_directory, {
        name: row.name,
        avatarUrl: row.avatar_url,
      });
    }
  }

  return owners;
}

export async function syncSessions(
  db: Db,
  projectId: string,
  userId: string,
  sessionIds: readonly string[],
): Promise<SyncSessionResult> {
  const sessionFiles = await findSessionFiles();
  const fileMap = new Map(sessionFiles.map((f) => [f.fileName.replace('.jsonl', ''), f]));

  const results: SyncSingleResult[] = [];
  let syncedCount = 0;

  for (const sessionId of sessionIds) {
    try {
      const file = fileMap.get(sessionId);
      if (!file) {
        results.push({ sessionId, success: false, error: 'Session file not found' });
        continue;
      }

      const content = await readFile(file.fullPath, 'utf-8');
      const { parsed, filePaths } = parseClaudeCodeSession(content);

      const importResult = await importParsedSession(db, projectId, userId, parsed, filePaths);

      // Record sync tracking
      await db
        .insertInto('synced_sessions')
        .values({
          project_id: projectId,
          session_id: importResult.session.id,
          external_session_id: sessionId,
          source_path: file.fullPath,
        })
        .onConflict((oc) =>
          oc.columns(['project_id', 'external_session_id']).doUpdateSet({
            synced_at: sql`NOW()`,
            source_path: file.fullPath,
          }),
        )
        .execute();

      results.push({
        sessionId,
        success: true,
        messageCount: importResult.messageCount,
        detectedConflicts: importResult.detectedConflicts,
      });
      syncedCount++;
    } catch (err) {
      results.push({
        sessionId,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return { syncedCount, results };
}

export async function recalculateTokenUsage(
  metaDb: Db,
  dataDb: Db,
  projectId: string,
  userId: string,
): Promise<RecalculateTokenResult> {
  // Authorization check runs against metaDb (where project metadata lives)
  await assertProjectAccess(metaDb, projectId, userId);

  // Find all synced sessions from the data DB (where sessions/synced_sessions live)
  const syncedRows = await dataDb
    .selectFrom('synced_sessions')
    .select(['session_id', 'external_session_id', 'source_path'])
    .where('project_id', '=', projectId)
    .execute();

  if (syncedRows.length === 0) {
    return { updatedSessions: 0, updatedMessages: 0, skipped: 0, errors: [] };
  }

  let updatedSessions = 0;
  let updatedMessages = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of syncedRows) {
    try {
      const content = await readFile(row.source_path, 'utf-8');
      const { parsed } = parseClaudeCodeSession(content);

      // Re-parsed data may have more messages (tool-use turns) than old parse.
      // Delete all messages and re-insert from scratch.
      await dataDb.deleteFrom('messages').where('session_id', '=', row.session_id).execute();

      const values = parsed.messages.map((msg, index) => ({
        session_id: row.session_id,
        role: msg.role,
        content: msg.content,
        content_type: msg.contentType ?? 'prompt',
        tokens_used: msg.tokensUsed ?? null,
        model_used: msg.modelUsed ?? null,
        sort_order: index,
        ...(msg.timestamp ? { created_at: new Date(msg.timestamp) } : {}),
      }));

      if (values.length > 0) {
        await dataDb.insertInto('messages').values(values).execute();
      }

      updatedSessions++;
      updatedMessages += values.length;
    } catch (err) {
      if (err instanceof Error && err.message.includes('ENOENT')) {
        skipped++;
      } else {
        errors.push(
          `${row.external_session_id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        );
      }
    }
  }

  return { updatedSessions, updatedMessages, skipped, errors };
}

export async function updateSyncedSession(
  db: Db,
  internalSessionId: string,
  file: SessionFile,
): Promise<{ readonly messageCount: number }> {
  const content = await readFile(file.fullPath, 'utf-8');
  const { parsed, filePaths } = parseClaudeCodeSession(content);

  // Delete old messages and re-insert from re-parsed content
  await db.deleteFrom('messages').where('session_id', '=', internalSessionId).execute();

  const values = parsed.messages.map((msg, index) => ({
    session_id: internalSessionId,
    role: msg.role,
    content: msg.content,
    content_type: msg.contentType ?? 'prompt',
    tokens_used: msg.tokensUsed ?? null,
    model_used: msg.modelUsed ?? null,
    sort_order: index,
    ...(msg.timestamp ? { created_at: new Date(msg.timestamp) } : {}),
  }));

  if (values.length > 0) {
    await db.insertInto('messages').values(values).execute();
  }

  // Update session metadata (title, file_paths) if changed
  await db
    .updateTable('sessions')
    .set({
      title: parsed.title,
      file_paths: (filePaths as string[]) ?? [],
      updated_at: new Date(),
    })
    .where('id', '=', internalSessionId)
    .execute();

  // Update synced_at timestamp
  await db
    .updateTable('synced_sessions')
    .set({ synced_at: sql`NOW()` })
    .where('session_id', '=', internalSessionId)
    .execute();

  return { messageCount: values.length };
}
