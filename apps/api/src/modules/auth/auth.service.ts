import crypto from 'node:crypto';
import type { Db } from '../../database/client.js';
import type { LoginInput, UpgradeInput } from './auth.schema.js';
import type { User, ClaudePlan } from '@context-sync/shared';
import { CLAUDE_PLANS } from '@context-sync/shared';
import { AppError } from '../../plugins/error-handler.plugin.js';

export async function findOrCreateByEmail(db: Db, input: LoginInput): Promise<User> {
  const existing = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', input.email)
    .executeTakeFirst();

  if (existing) {
    const updated = await db
      .updateTable('users')
      .set({
        name: input.name,
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
      email: input.email,
      name: input.name,
      avatar_url: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return toUser(created);
}

export async function createAutoUser(db: Db): Promise<User> {
  const uuid = crypto.randomUUID();
  const autoEmail = `auto_${uuid}@local`;

  const created = await db
    .insertInto('users')
    .values({
      email: autoEmail,
      name: 'Local User',
      avatar_url: null,
      is_auto: true,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return toUser(created);
}

export async function upgradeAutoUser(db: Db, input: UpgradeInput): Promise<User> {
  const autoUser = await db
    .selectFrom('users')
    .selectAll()
    .where('id', '=', input.autoUserId)
    .executeTakeFirst();

  if (!autoUser) {
    throw new AppError('User not found', 404);
  }

  if (!autoUser.is_auto) {
    throw new AppError('User is already upgraded', 400);
  }

  const existingUser = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', input.email)
    .where('id', '!=', input.autoUserId)
    .executeTakeFirst();

  if (existingUser) {
    return await mergeAutoUserIntoExisting(db, autoUser.id, existingUser.id);
  }

  const updated = await db
    .updateTable('users')
    .set({
      email: input.email,
      name: input.name,
      is_auto: false,
      updated_at: new Date(),
    })
    .where('id', '=', input.autoUserId)
    .returningAll()
    .executeTakeFirstOrThrow();

  return toUser(updated);
}

async function mergeAutoUserIntoExisting(
  db: Db,
  autoUserId: string,
  existingUserId: string,
): Promise<User> {
  return await db.transaction().execute(async (trx) => {
    await trx
      .updateTable('projects')
      .set({ owner_id: existingUserId })
      .where('owner_id', '=', autoUserId)
      .execute();

    await trx
      .updateTable('sessions')
      .set({ user_id: existingUserId })
      .where('user_id', '=', autoUserId)
      .execute();

    await trx
      .updateTable('project_collaborators')
      .set({ user_id: existingUserId })
      .where('user_id', '=', autoUserId)
      .execute();

    await trx
      .updateTable('activity_log')
      .set({ user_id: existingUserId })
      .where('user_id', '=', autoUserId)
      .execute();

    await trx
      .updateTable('prd_documents')
      .set({ user_id: existingUserId })
      .where('user_id', '=', autoUserId)
      .execute();

    await trx
      .updateTable('prompt_templates')
      .set({ author_id: existingUserId })
      .where('author_id', '=', autoUserId)
      .execute();

    await trx
      .updateTable('conflicts')
      .set({ resolved_by: existingUserId })
      .where('resolved_by', '=', autoUserId)
      .execute();

    await trx
      .updateTable('ai_evaluations')
      .set({ target_user_id: existingUserId })
      .where('target_user_id', '=', autoUserId)
      .execute();

    await trx
      .updateTable('ai_evaluations')
      .set({ triggered_by_user_id: existingUserId })
      .where('triggered_by_user_id', '=', autoUserId)
      .execute();

    await trx.deleteFrom('users').where('id', '=', autoUserId).execute();

    const merged = await trx
      .selectFrom('users')
      .selectAll()
      .where('id', '=', existingUserId)
      .executeTakeFirstOrThrow();

    return toUser(merged);
  });
}

export async function findUserById(db: Db, id: string): Promise<User | null> {
  const row = await db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();

  return row ? toUser(row) : null;
}

export async function updateUserPlan(
  db: Db,
  userId: string,
  claudePlan: ClaudePlan,
): Promise<User> {
  if (!CLAUDE_PLANS.includes(claudePlan)) {
    throw new AppError('Invalid Claude plan', 400);
  }

  const updated = await db
    .updateTable('users')
    .set({ claude_plan: claudePlan, updated_at: new Date() })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirst();

  if (!updated) {
    throw new AppError('User not found', 404);
  }

  return toUser(updated);
}

function toUser(row: {
  id: string;
  github_id: number | null;
  email: string;
  name: string;
  avatar_url: string | null;
  role: string;
  is_auto: boolean;
  claude_plan: string;
  created_at: Date;
  updated_at: Date;
}): User {
  return {
    id: row.id,
    githubId: row.github_id ?? null,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    role: row.role as User['role'],
    isAuto: row.is_auto,
    claudePlan: row.claude_plan as ClaudePlan,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
