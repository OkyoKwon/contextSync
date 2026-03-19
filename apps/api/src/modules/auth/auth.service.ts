import type { Db } from '../../database/client.js';
import type { GitHubProfile } from './github-oauth.client.js';
import type { User } from '@context-sync/shared';

export async function findOrCreateUser(db: Db, profile: GitHubProfile): Promise<User> {
  const existing = await db
    .selectFrom('users')
    .selectAll()
    .where('github_id', '=', profile.githubId)
    .executeTakeFirst();

  if (existing) {
    const updated = await db
      .updateTable('users')
      .set({
        name: profile.name,
        email: profile.email,
        avatar_url: profile.avatarUrl,
        updated_at: new Date(),
      })
      .where('id', '=', existing.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return toUser(updated);
  }

  const created = await db
    .insertInto('users')
    .values({
      github_id: profile.githubId,
      email: profile.email,
      name: profile.name,
      avatar_url: profile.avatarUrl,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return toUser(created);
}

export async function findUserById(db: Db, id: string): Promise<User | null> {
  const row = await db
    .selectFrom('users')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();

  return row ? toUser(row) : null;
}

function toUser(row: {
  id: string;
  github_id: number;
  email: string;
  name: string;
  avatar_url: string | null;
  role: string;
  created_at: Date;
  updated_at: Date;
}): User {
  return {
    id: row.id,
    githubId: row.github_id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    role: row.role as User['role'],
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
