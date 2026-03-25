import type { Db } from '../database/client.js';
import { syncUserToRemote } from './user-sync.js';

/**
 * Ensure a user record exists on the remote database (FK integrity).
 * Uses the lightweight syncUserToRemote upsert — safe to call repeatedly.
 */
export async function ensureUserOnRemote(localDb: Db, remoteDb: Db, userId: string): Promise<void> {
  const row = await localDb
    .selectFrom('users')
    .select(['id', 'name', 'email', 'avatar_url'])
    .where('id', '=', userId)
    .executeTakeFirst();

  if (!row) return;

  await syncUserToRemote(remoteDb, {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url,
    // Fields below are required by the User type but not used by syncUserToRemote
    githubId: null,
    role: 'member',
    claudePlan: 'free',
    hasAnthropicApiKey: false,
    hasSupabaseToken: false,
    createdAt: '',
    updatedAt: '',
  });
}

/**
 * Replicate a project record (and its owner user) to the remote database.
 * Uses upsert so it's safe to call repeatedly.
 */
export async function syncProjectToRemote(
  localDb: Db,
  remoteDb: Db,
  projectId: string,
  ownerUserId: string,
): Promise<void> {
  // 1. Ensure owner user exists on remote (FK: projects.owner_id → users.id)
  await ensureUserOnRemote(localDb, remoteDb, ownerUserId);

  // 2. Upsert project record
  const project = await localDb
    .selectFrom('projects')
    .select([
      'id',
      'owner_id',
      'name',
      'description',
      'repo_url',
      'local_directory',
      'database_mode',
    ])
    .where('id', '=', projectId)
    .executeTakeFirst();

  if (!project) return;

  await remoteDb
    .insertInto('projects')
    .values({
      id: project.id,
      owner_id: project.owner_id,
      name: project.name,
      description: project.description,
      repo_url: project.repo_url,
      local_directory: project.local_directory,
      database_mode: 'remote',
    })
    .onConflict((oc) =>
      oc.column('id').doUpdateSet({
        name: project.name,
        description: project.description,
        database_mode: 'remote',
        updated_at: new Date(),
      }),
    )
    .execute();
}
