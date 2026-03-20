import crypto from 'node:crypto';
import type { Db } from '../../database/client.js';
import type { Invitation, InvitationStatus } from '@context-sync/shared';
import { INVITATION_EXPIRY_DAYS } from '@context-sync/shared';

function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function computeExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + INVITATION_EXPIRY_DAYS);
  return d;
}

interface UpsertInvitationInput {
  readonly projectId: string;
  readonly inviterId: string;
  readonly email: string;
  readonly role: string;
}

export async function upsertInvitation(db: Db, input: UpsertInvitationInput): Promise<Invitation> {
  const token = generateToken();
  const expiresAt = computeExpiresAt();

  // Cancel existing pending invitation for same project+email, then insert new
  await db
    .updateTable('project_invitations')
    .set({ status: 'cancelled', updated_at: new Date() })
    .where('project_id', '=', input.projectId)
    .where('email', '=', input.email)
    .where('status', '=', 'pending')
    .execute();

  const row = await db
    .insertInto('project_invitations')
    .values({
      project_id: input.projectId,
      inviter_id: input.inviterId,
      email: input.email,
      token,
      role: input.role,
      expires_at: expiresAt,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  // Fetch joined data for full Invitation shape
  return findByIdJoined(db, row.id);
}

async function findByIdJoined(db: Db, id: string): Promise<Invitation> {
  const row = await db
    .selectFrom('project_invitations')
    .innerJoin('projects', 'projects.id', 'project_invitations.project_id')
    .innerJoin('users', 'users.id', 'project_invitations.inviter_id')
    .select([
      'project_invitations.id',
      'project_invitations.project_id',
      'projects.name as project_name',
      'project_invitations.inviter_id',
      'users.name as inviter_name',
      'users.avatar_url as inviter_avatar_url',
      'project_invitations.email',
      'project_invitations.role',
      'project_invitations.status',
      'project_invitations.expires_at',
      'project_invitations.created_at',
    ])
    .where('project_invitations.id', '=', id)
    .executeTakeFirstOrThrow();

  return toInvitation(row);
}

export async function findByToken(db: Db, token: string): Promise<Invitation | null> {
  const row = await db
    .selectFrom('project_invitations')
    .innerJoin('projects', 'projects.id', 'project_invitations.project_id')
    .innerJoin('users', 'users.id', 'project_invitations.inviter_id')
    .select([
      'project_invitations.id',
      'project_invitations.project_id',
      'projects.name as project_name',
      'project_invitations.inviter_id',
      'users.name as inviter_name',
      'users.avatar_url as inviter_avatar_url',
      'project_invitations.email',
      'project_invitations.role',
      'project_invitations.status',
      'project_invitations.expires_at',
      'project_invitations.created_at',
    ])
    .where('project_invitations.token', '=', token)
    .executeTakeFirst();

  return row ? toInvitation(row) : null;
}

export async function findPendingByProjectId(
  db: Db,
  projectId: string,
): Promise<readonly Invitation[]> {
  const rows = await db
    .selectFrom('project_invitations')
    .innerJoin('projects', 'projects.id', 'project_invitations.project_id')
    .innerJoin('users', 'users.id', 'project_invitations.inviter_id')
    .select([
      'project_invitations.id',
      'project_invitations.project_id',
      'projects.name as project_name',
      'project_invitations.inviter_id',
      'users.name as inviter_name',
      'users.avatar_url as inviter_avatar_url',
      'project_invitations.email',
      'project_invitations.role',
      'project_invitations.status',
      'project_invitations.expires_at',
      'project_invitations.created_at',
    ])
    .where('project_invitations.project_id', '=', projectId)
    .where('project_invitations.status', '=', 'pending')
    .orderBy('project_invitations.created_at', 'desc')
    .execute();

  return rows.map(toInvitation);
}

export async function findPendingByEmail(db: Db, email: string): Promise<readonly Invitation[]> {
  const rows = await db
    .selectFrom('project_invitations')
    .innerJoin('projects', 'projects.id', 'project_invitations.project_id')
    .innerJoin('users', 'users.id', 'project_invitations.inviter_id')
    .select([
      'project_invitations.id',
      'project_invitations.project_id',
      'projects.name as project_name',
      'project_invitations.inviter_id',
      'users.name as inviter_name',
      'users.avatar_url as inviter_avatar_url',
      'project_invitations.email',
      'project_invitations.role',
      'project_invitations.status',
      'project_invitations.expires_at',
      'project_invitations.created_at',
    ])
    .where('project_invitations.email', '=', email)
    .where('project_invitations.status', '=', 'pending')
    .orderBy('project_invitations.created_at', 'desc')
    .execute();

  return rows.map(toInvitation);
}

export async function updateStatus(
  db: Db,
  id: string,
  status: InvitationStatus,
  timestamps?: { readonly acceptedAt?: Date; readonly declinedAt?: Date },
): Promise<void> {
  await db
    .updateTable('project_invitations')
    .set({
      status,
      updated_at: new Date(),
      ...(timestamps?.acceptedAt && { accepted_at: timestamps.acceptedAt }),
      ...(timestamps?.declinedAt && { declined_at: timestamps.declinedAt }),
    })
    .where('id', '=', id)
    .execute();
}

export async function cancelById(db: Db, id: string): Promise<void> {
  await db
    .updateTable('project_invitations')
    .set({ status: 'cancelled', updated_at: new Date() })
    .where('id', '=', id)
    .execute();
}

export async function expireOverdue(db: Db, email: string): Promise<void> {
  await db
    .updateTable('project_invitations')
    .set({ status: 'expired', updated_at: new Date() })
    .where('email', '=', email)
    .where('status', '=', 'pending')
    .where('expires_at', '<', new Date())
    .execute();
}

export async function findInvitationOwnerProjectId(
  db: Db,
  invitationId: string,
): Promise<{ projectId: string; status: string } | null> {
  const row = await db
    .selectFrom('project_invitations')
    .select(['project_id', 'status'])
    .where('id', '=', invitationId)
    .executeTakeFirst();

  return row ? { projectId: row.project_id, status: row.status } : null;
}

function toInvitation(row: {
  id: string;
  project_id: string;
  project_name: string;
  inviter_id: string;
  inviter_name: string;
  inviter_avatar_url: string | null;
  email: string;
  role: string;
  status: string;
  expires_at: Date;
  created_at: Date;
}): Invitation {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name,
    inviterId: row.inviter_id,
    inviterName: row.inviter_name,
    inviterAvatarUrl: row.inviter_avatar_url,
    email: row.email,
    role: row.role,
    status: row.status as Invitation['status'],
    expiresAt: row.expires_at.toISOString(),
    createdAt: row.created_at.toISOString(),
  };
}
