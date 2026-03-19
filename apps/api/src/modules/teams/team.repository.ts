import type { Db } from '../../database/client.js';
import type { Team, TeamMember } from '@context-sync/shared';

export async function createTeam(
  db: Db,
  input: { name: string; slug: string },
  ownerId: string,
): Promise<Team> {
  return await db.transaction().execute(async (trx) => {
    const team = await trx
      .insertInto('teams')
      .values({ name: input.name, slug: input.slug })
      .returningAll()
      .executeTakeFirstOrThrow();

    await trx
      .insertInto('team_members')
      .values({ team_id: team.id, user_id: ownerId, role: 'owner' })
      .execute();

    return toTeam(team);
  });
}

export async function findTeamById(db: Db, id: string): Promise<Team | null> {
  const row = await db.selectFrom('teams').selectAll().where('id', '=', id).executeTakeFirst();
  return row ? toTeam(row) : null;
}

export async function findTeamsByUserId(db: Db, userId: string): Promise<readonly Team[]> {
  const rows = await db
    .selectFrom('teams')
    .innerJoin('team_members', 'team_members.team_id', 'teams.id')
    .selectAll('teams')
    .where('team_members.user_id', '=', userId)
    .orderBy('teams.created_at', 'desc')
    .execute();

  return rows.map(toTeam);
}

export async function updateTeam(
  db: Db,
  id: string,
  input: { name?: string; settings?: Record<string, unknown> },
): Promise<Team> {
  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (input.name) updates['name'] = input.name;
  if (input.settings) updates['settings'] = JSON.stringify(input.settings);

  const row = await db
    .updateTable('teams')
    .set(updates)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();

  return toTeam(row);
}

export async function findTeamMembers(db: Db, teamId: string): Promise<readonly TeamMember[]> {
  const rows = await db
    .selectFrom('team_members')
    .innerJoin('users', 'users.id', 'team_members.user_id')
    .select([
      'team_members.id',
      'team_members.team_id',
      'team_members.user_id',
      'team_members.role',
      'team_members.joined_at',
      'users.name as user_name',
      'users.email as user_email',
      'users.avatar_url as user_avatar_url',
    ])
    .where('team_members.team_id', '=', teamId)
    .execute();

  return rows.map((row) => ({
    id: row.id,
    teamId: row.team_id,
    userId: row.user_id,
    role: row.role as TeamMember['role'],
    joinedAt: row.joined_at.toISOString(),
    userName: row.user_name,
    userEmail: row.user_email,
    userAvatarUrl: row.user_avatar_url,
  }));
}

export async function addTeamMember(
  db: Db,
  teamId: string,
  userId: string,
  role: string = 'member',
): Promise<void> {
  await db
    .insertInto('team_members')
    .values({ team_id: teamId, user_id: userId, role })
    .execute();
}

export async function removeTeamMember(db: Db, teamId: string, userId: string): Promise<void> {
  await db
    .deleteFrom('team_members')
    .where('team_id', '=', teamId)
    .where('user_id', '=', userId)
    .execute();
}

export async function isTeamMember(db: Db, teamId: string, userId: string): Promise<boolean> {
  const row = await db
    .selectFrom('team_members')
    .select('id')
    .where('team_id', '=', teamId)
    .where('user_id', '=', userId)
    .executeTakeFirst();

  return !!row;
}

function toTeam(row: {
  id: string;
  name: string;
  slug: string;
  settings: string;
  created_at: Date;
  updated_at: Date;
}): Team {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
