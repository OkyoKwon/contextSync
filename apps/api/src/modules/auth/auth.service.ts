import crypto from 'node:crypto';
import type { Db } from '../../database/client.js';
import type { LoginInput } from './auth.schema.js';
import type { User, ClaudePlan } from '@context-sync/shared';
import { CLAUDE_PLANS } from '@context-sync/shared';
import { AppError } from '../../plugins/error-handler.plugin.js';
import { encrypt, decrypt } from '../../lib/encryption.js';
import { detectPlan } from '../quota/quota.service.js';

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

export interface IdentifyResult {
  readonly users: readonly User[];
  readonly created: boolean;
}

export async function findOrCreateByName(db: Db, name: string): Promise<IdentifyResult> {
  const existing = await db
    .selectFrom('users')
    .selectAll()
    .where('name', '=', name)
    .where('is_auto', '=', false)
    .execute();

  if (existing.length >= 1) {
    return { users: existing.map(toUser), created: false };
  }

  const email = `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}-${crypto.randomUUID().slice(0, 8)}@local`;
  const created = await db
    .insertInto('users')
    .values({
      email,
      name,
      avatar_url: null,
      is_auto: false,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return { users: [toUser(created)], created: true };
}

export async function findUserById(db: Db, id: string): Promise<User | null> {
  const row = await db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();

  if (!row) return null;

  const user = toUser(row);

  if (user.claudePlan === 'free') {
    const detected = await detectPlan(db, id);
    if (detected.plan !== 'free') {
      const updated = await db
        .updateTable('users')
        .set({
          claude_plan: detected.plan,
          plan_detection_source: detected.source,
          updated_at: new Date(),
        })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();
      return toUser(updated);
    }
  }

  return user;
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

export async function updateApiKey(db: Db, userId: string, apiKey: string): Promise<User> {
  const updated = await db
    .updateTable('users')
    .set({ anthropic_api_key: apiKey, updated_at: new Date() })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirst();

  if (!updated) {
    throw new AppError('User not found', 404);
  }

  return toUser(updated);
}

export async function deleteApiKey(db: Db, userId: string): Promise<User> {
  const updated = await db
    .updateTable('users')
    .set({ anthropic_api_key: null, updated_at: new Date() })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirst();

  if (!updated) {
    throw new AppError('User not found', 404);
  }

  return toUser(updated);
}

export async function getUserApiKey(db: Db, userId: string): Promise<string | null> {
  const row = await db
    .selectFrom('users')
    .select('anthropic_api_key')
    .where('id', '=', userId)
    .executeTakeFirst();

  return row?.anthropic_api_key ?? null;
}

export async function saveSupabaseToken(
  db: Db,
  userId: string,
  token: string,
  jwtSecret: string,
): Promise<User> {
  const encryptedToken = encrypt(token, jwtSecret);

  const updated = await db
    .updateTable('users')
    .set({ supabase_access_token: encryptedToken, updated_at: new Date() })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirst();

  if (!updated) {
    throw new AppError('User not found', 404);
  }

  return toUser(updated);
}

export async function deleteSupabaseToken(db: Db, userId: string): Promise<User> {
  const updated = await db
    .updateTable('users')
    .set({ supabase_access_token: null, updated_at: new Date() })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirst();

  if (!updated) {
    throw new AppError('User not found', 404);
  }

  return toUser(updated);
}

export async function getSupabaseToken(
  db: Db,
  userId: string,
  jwtSecret: string,
): Promise<string | null> {
  const row = await db
    .selectFrom('users')
    .select('supabase_access_token')
    .where('id', '=', userId)
    .executeTakeFirst();

  if (!row?.supabase_access_token) return null;

  return decrypt(row.supabase_access_token, jwtSecret);
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
  anthropic_api_key: string | null;
  supabase_access_token: string | null;
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
    claudePlan: row.claude_plan as ClaudePlan,
    hasAnthropicApiKey: row.anthropic_api_key !== null && row.anthropic_api_key !== '',
    hasSupabaseToken: row.supabase_access_token !== null && row.supabase_access_token !== '',
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
