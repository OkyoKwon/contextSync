import { sql } from 'kysely';
import type { Db } from '../../database/client.js';
import type { Project, ProjectWithTeamInfo } from '@context-sync/shared';

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

export async function findProjectsWithTeamInfo(
  db: Db,
  userId: string,
): Promise<readonly ProjectWithTeamInfo[]> {
  const rows = await db
    .selectFrom('projects')
    .leftJoin(
      db
        .selectFrom('project_collaborators')
        .select(['project_id', sql<number>`count(*)`.as('cnt')])
        .groupBy('project_id')
        .as('collab_counts'),
      'collab_counts.project_id',
      'projects.id',
    )
    .select([
      'projects.id',
      'projects.owner_id',
      'projects.name',
      'projects.description',
      'projects.repo_url',
      'projects.local_directory',
      'projects.created_at',
      'projects.updated_at',
      sql<number>`COALESCE(collab_counts.cnt, 0)`.as('collaborator_count'),
    ])
    .where((eb) =>
      eb.or([
        eb('projects.owner_id', '=', userId),
        eb(
          'projects.id',
          'in',
          eb
            .selectFrom('project_collaborators')
            .select('project_id')
            .where('user_id', '=', userId),
        ),
      ]),
    )
    .orderBy('projects.created_at', 'desc')
    .execute();

  return rows.map(toProjectWithTeamInfo);
}

export async function findProjectByIdWithTeamInfo(
  db: Db,
  id: string,
): Promise<ProjectWithTeamInfo | null> {
  const row = await db
    .selectFrom('projects')
    .leftJoin(
      db
        .selectFrom('project_collaborators')
        .select(['project_id', sql<number>`count(*)`.as('cnt')])
        .groupBy('project_id')
        .as('collab_counts'),
      'collab_counts.project_id',
      'projects.id',
    )
    .select([
      'projects.id',
      'projects.owner_id',
      'projects.name',
      'projects.description',
      'projects.repo_url',
      'projects.local_directory',
      'projects.created_at',
      'projects.updated_at',
      sql<number>`COALESCE(collab_counts.cnt, 0)`.as('collaborator_count'),
    ])
    .where('projects.id', '=', id)
    .executeTakeFirst();

  return row ? toProjectWithTeamInfo(row) : null;
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

function toProjectWithTeamInfo(row: {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  repo_url: string | null;
  local_directory: string | null;
  created_at: Date;
  updated_at: Date;
  collaborator_count: number;
}): ProjectWithTeamInfo {
  const count = Number(row.collaborator_count);
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    repoUrl: row.repo_url,
    localDirectory: row.local_directory,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    collaboratorCount: count,
    isTeam: count > 0,
  };
}
