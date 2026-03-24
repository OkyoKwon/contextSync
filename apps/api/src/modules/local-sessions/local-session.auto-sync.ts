import { readFile } from 'node:fs/promises';
import type { Db } from '../../database/client.js';
import type { SessionFile } from './local-session.service.js';
import { parseClaudeCodeSession } from '../sessions/parsers/claude-code-session.parser.js';
import { importParsedSession } from '../sessions/session-import.service.js';
import { getProjectSessionFiles, updateSyncedSession } from './local-session.sync.js';
import { sql } from 'kysely';

export interface AutoSyncTask {
  readonly projectId: string;
  readonly externalSessionId: string;
  readonly file: SessionFile;
  readonly isUpdate: boolean;
  readonly internalSessionId?: string;
}

export interface AutoSyncReport {
  readonly newSynced: number;
  readonly updated: number;
  readonly errors: number;
}

interface UserProject {
  readonly projectId: string;
  readonly role: 'owner' | 'collaborator';
}

async function findUserProjects(db: Db, userId: string): Promise<readonly UserProject[]> {
  const ownedProjects = await db
    .selectFrom('projects')
    .select('id')
    .where('owner_id', '=', userId)
    .where('local_directory', 'is not', null)
    .execute();

  const collabProjects = await db
    .selectFrom('project_collaborators')
    .select('project_id')
    .where('user_id', '=', userId)
    .where('local_directory', 'is not', null)
    .execute();

  const projects: UserProject[] = [
    ...ownedProjects.map((p) => ({ projectId: p.id, role: 'owner' as const })),
    ...collabProjects.map((p) => ({ projectId: p.project_id, role: 'collaborator' as const })),
  ];

  return projects;
}

export async function detectSyncTasks(db: Db, userId: string): Promise<readonly AutoSyncTask[]> {
  const projects = await findUserProjects(db, userId);
  if (projects.length === 0) return [];

  const tasks: AutoSyncTask[] = [];

  for (const project of projects) {
    const sessionFiles = await getProjectSessionFiles(db, project.projectId);
    if (sessionFiles.length === 0) continue;

    const externalIds = sessionFiles.map((f) => f.fileName.replace('.jsonl', ''));

    const syncedRows = await db
      .selectFrom('synced_sessions')
      .select(['external_session_id', 'session_id', 'synced_at'])
      .where('project_id', '=', project.projectId)
      .where('external_session_id', 'in', externalIds)
      .execute();

    const syncedMap = new Map(
      syncedRows.map((r) => [
        r.external_session_id,
        { sessionId: r.session_id, syncedAt: r.synced_at },
      ]),
    );

    for (const file of sessionFiles) {
      const externalId = file.fileName.replace('.jsonl', '');
      const synced = syncedMap.get(externalId);

      if (!synced) {
        tasks.push({
          projectId: project.projectId,
          externalSessionId: externalId,
          file,
          isUpdate: false,
        });
      } else if (file.lastModifiedMs > synced.syncedAt.getTime()) {
        tasks.push({
          projectId: project.projectId,
          externalSessionId: externalId,
          file,
          isUpdate: true,
          internalSessionId: synced.sessionId,
        });
      }
    }
  }

  return tasks;
}

export async function executeAutoSync(
  db: Db,
  userId: string,
  tasks: readonly AutoSyncTask[],
): Promise<AutoSyncReport> {
  let newSynced = 0;
  let updated = 0;
  let errors = 0;

  for (const task of tasks) {
    try {
      if (task.isUpdate && task.internalSessionId) {
        await updateSyncedSession(db, task.internalSessionId, task.file);
        updated++;
      } else {
        const content = await readFile(task.file.fullPath, 'utf-8');
        const { parsed, filePaths } = parseClaudeCodeSession(content);
        const result = await importParsedSession(db, task.projectId, userId, parsed, filePaths);

        await db
          .insertInto('synced_sessions')
          .values({
            project_id: task.projectId,
            session_id: result.session.id,
            external_session_id: task.externalSessionId,
            source_path: task.file.fullPath,
          })
          .onConflict((oc) =>
            oc.columns(['project_id', 'external_session_id']).doUpdateSet({
              synced_at: sql`NOW()`,
              source_path: task.file.fullPath,
            }),
          )
          .execute();

        newSynced++;
      }
    } catch {
      errors++;
    }
  }

  return { newSynced, updated, errors };
}
