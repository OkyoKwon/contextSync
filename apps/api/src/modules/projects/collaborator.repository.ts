import type { Db } from '../../database/client.js';
import type { Collaborator } from '@context-sync/shared';

export async function findCollaboratorsByProjectId(
  db: Db,
  projectId: string,
): Promise<readonly Collaborator[]> {
  const rows = await db
    .selectFrom('project_collaborators')
    .innerJoin('users', 'users.id', 'project_collaborators.user_id')
    .select([
      'project_collaborators.id',
      'project_collaborators.project_id',
      'project_collaborators.user_id',
      'project_collaborators.role',
      'project_collaborators.added_at',
      'users.name as user_name',
      'users.email as user_email',
      'users.avatar_url as user_avatar_url',
    ])
    .where('project_collaborators.project_id', '=', projectId)
    .orderBy('project_collaborators.added_at', 'asc')
    .execute();

  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role as Collaborator['role'],
    addedAt: row.added_at.toISOString(),
    userName: row.user_name,
    userEmail: row.user_email,
    userAvatarUrl: row.user_avatar_url,
  }));
}

export async function addCollaborator(
  db: Db,
  projectId: string,
  userId: string,
  role: string = 'member',
): Promise<void> {
  await db
    .insertInto('project_collaborators')
    .values({ project_id: projectId, user_id: userId, role })
    .execute();
}

export async function removeCollaborator(
  db: Db,
  projectId: string,
  userId: string,
): Promise<void> {
  await db
    .deleteFrom('project_collaborators')
    .where('project_id', '=', projectId)
    .where('user_id', '=', userId)
    .execute();
}

export async function findCollaboratorByProjectAndUser(
  db: Db,
  projectId: string,
  userId: string,
): Promise<Collaborator | null> {
  const row = await db
    .selectFrom('project_collaborators')
    .innerJoin('users', 'users.id', 'project_collaborators.user_id')
    .select([
      'project_collaborators.id',
      'project_collaborators.project_id',
      'project_collaborators.user_id',
      'project_collaborators.role',
      'project_collaborators.added_at',
      'users.name as user_name',
      'users.email as user_email',
      'users.avatar_url as user_avatar_url',
    ])
    .where('project_collaborators.project_id', '=', projectId)
    .where('project_collaborators.user_id', '=', userId)
    .executeTakeFirst();

  if (!row) return null;

  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role as Collaborator['role'],
    addedAt: row.added_at.toISOString(),
    userName: row.user_name,
    userEmail: row.user_email,
    userAvatarUrl: row.user_avatar_url,
  };
}

export async function isCollaborator(
  db: Db,
  projectId: string,
  userId: string,
): Promise<boolean> {
  const row = await db
    .selectFrom('project_collaborators')
    .select('id')
    .where('project_id', '=', projectId)
    .where('user_id', '=', userId)
    .executeTakeFirst();

  return !!row;
}
