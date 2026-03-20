import type { Db } from '../../database/client.js';
import type { Project } from '@context-sync/shared';

export async function createProject(
  db: Db,
  teamId: string,
  input: { name: string; description?: string; repoUrl?: string },
): Promise<Project> {
  const row = await db
    .insertInto('projects')
    .values({
      team_id: teamId,
      owner_id: null,
      name: input.name,
      description: input.description ?? null,
      repo_url: input.repoUrl ?? null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return toProject(row);
}

export async function createPersonalProject(
  db: Db,
  ownerId: string,
  input: { name: string; description?: string; repoUrl?: string; localDirectory?: string },
): Promise<Project> {
  const row = await db
    .insertInto('projects')
    .values({
      team_id: null,
      owner_id: ownerId,
      name: input.name,
      description: input.description ?? null,
      repo_url: input.repoUrl ?? null,
      local_directory: input.localDirectory ?? null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return toProject(row);
}

export async function findProjectsByTeamId(db: Db, teamId: string): Promise<readonly Project[]> {
  const rows = await db
    .selectFrom('projects')
    .selectAll()
    .where('team_id', '=', teamId)
    .orderBy('created_at', 'desc')
    .execute();

  return rows.map(toProject);
}

export async function findProjectsByOwnerId(db: Db, ownerId: string): Promise<readonly Project[]> {
  const rows = await db
    .selectFrom('projects')
    .selectAll()
    .where('owner_id', '=', ownerId)
    .orderBy('created_at', 'desc')
    .execute();

  return rows.map(toProject);
}

export async function findProjectById(db: Db, id: string): Promise<Project | null> {
  const row = await db.selectFrom('projects').selectAll().where('id', '=', id).executeTakeFirst();
  return row ? toProject(row) : null;
}

export async function updateProject(
  db: Db,
  id: string,
  input: { name?: string; description?: string; repoUrl?: string },
): Promise<Project> {
  const row = await db
    .updateTable('projects')
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.repoUrl !== undefined && { repo_url: input.repoUrl }),
      updated_at: new Date(),
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();

  return toProject(row);
}

function toProject(row: {
  id: string;
  team_id: string | null;
  owner_id: string | null;
  name: string;
  description: string | null;
  repo_url: string | null;
  local_directory: string | null;
  created_at: Date;
  updated_at: Date;
}): Project {
  const base = {
    id: row.id,
    name: row.name,
    description: row.description,
    repoUrl: row.repo_url,
    localDirectory: row.local_directory,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };

  if (row.team_id !== null) {
    return { ...base, kind: 'team' as const, teamId: row.team_id, ownerId: null };
  }
  return { ...base, kind: 'personal' as const, ownerId: row.owner_id!, teamId: null };
}
