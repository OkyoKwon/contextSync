import type { Db } from '../../database/client.js';
import type { Project } from '@context-sync/shared';

export async function createProject(
  db: Db,
  ownerId: string,
  input: { name: string; description?: string; repoUrl?: string; localDirectory?: string },
): Promise<Project> {
  const row = await db
    .insertInto('projects')
    .values({
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

export async function findProjectsByUserId(db: Db, userId: string): Promise<readonly Project[]> {
  const ownedRows = await db
    .selectFrom('projects')
    .selectAll()
    .where('owner_id', '=', userId)
    .execute();

  const collabRows = await db
    .selectFrom('projects')
    .selectAll()
    .innerJoin('project_collaborators', 'project_collaborators.project_id', 'projects.id')
    .where('project_collaborators.user_id', '=', userId)
    .select([
      'projects.id',
      'projects.owner_id',
      'projects.name',
      'projects.description',
      'projects.repo_url',
      'projects.local_directory',
      'projects.created_at',
      'projects.updated_at',
    ])
    .execute();

  const seen = new Set(ownedRows.map((r) => r.id));
  const combined = [...ownedRows];
  for (const row of collabRows) {
    if (!seen.has(row.id)) {
      combined.push(row as typeof ownedRows[number]);
      seen.add(row.id);
    }
  }

  combined.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  return combined.map(toProject);
}

export async function findProjectById(db: Db, id: string): Promise<Project | null> {
  const row = await db.selectFrom('projects').selectAll().where('id', '=', id).executeTakeFirst();
  return row ? toProject(row) : null;
}

export async function updateProject(
  db: Db,
  id: string,
  input: { name?: string; description?: string; repoUrl?: string; localDirectory?: string | null },
): Promise<Project> {
  const row = await db
    .updateTable('projects')
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.repoUrl !== undefined && { repo_url: input.repoUrl }),
      ...(input.localDirectory !== undefined && { local_directory: input.localDirectory }),
      updated_at: new Date(),
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();

  return toProject(row);
}

export async function deleteProject(db: Db, id: string): Promise<void> {
  await db.deleteFrom('projects').where('id', '=', id).execute();
}

function toProject(row: {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  repo_url: string | null;
  local_directory: string | null;
  created_at: Date;
  updated_at: Date;
}): Project {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    repoUrl: row.repo_url,
    localDirectory: row.local_directory,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
