import type { Db } from '../../database/client.js';
import type { Env } from '../../config/env.js';
import type { Invitation, CreateInvitationInput } from '@context-sync/shared';
import { ForbiddenError, AppError } from '../../plugins/error-handler.plugin.js';
import { assertPermission } from '../projects/permission.helper.js';
import * as invitationRepo from './invitation.repository.js';
import * as collabRepo from '../projects/collaborator.repository.js';
import * as projectRepo from '../projects/project.repository.js';
import { logActivity } from '../activity/activity.service.js';
import {
  createEmailChannel,
  buildInvitationEmailHtml,
} from '../notifications/channels/email.channel.js';

export async function createInvitation(
  db: Db,
  projectId: string,
  inviterId: string,
  input: CreateInvitationInput,
  env: Env,
): Promise<Invitation> {
  await assertPermission(db, projectId, inviterId, 'collaborator:manage');

  // Check if already a collaborator
  const existingUser = await db
    .selectFrom('users')
    .select('id')
    .where('email', '=', input.email)
    .executeTakeFirst();

  if (existingUser) {
    const isCollab = await collabRepo.isCollaborator(db, projectId, existingUser.id);
    if (isCollab) {
      throw new AppError('User is already a collaborator', 409);
    }
    // Also check if owner
    const project = await projectRepo.findProjectById(db, projectId);
    if (project && project.ownerId === existingUser.id) {
      throw new AppError('User is the project owner', 409);
    }
  }

  const invitation = await invitationRepo.upsertInvitation(db, {
    projectId,
    inviterId,
    email: input.email,
    role: input.role ?? 'member',
  });

  // Fetch token for email
  const tokenRow = await db
    .selectFrom('project_invitations')
    .select('token')
    .where('id', '=', invitation.id)
    .executeTakeFirstOrThrow();

  // Send invitation email
  const emailChannel = createEmailChannel(env.RESEND_API_KEY, env.EMAIL_FROM);
  const verifyUrl = `${env.FRONTEND_URL}/invitations/accept?token=${tokenRow.token}`;
  const html = buildInvitationEmailHtml(
    invitation.inviterName,
    invitation.projectName,
    invitation.role,
    verifyUrl,
  );
  emailChannel
    .send(input.email, `[ContextSync] You've been invited to ${invitation.projectName}`, html)
    .catch(() => {
      // fire-and-forget: email failure should not block invitation creation
    });

  logActivity(db, {
    projectId,
    userId: inviterId,
    action: 'invitation_sent',
    entityType: 'invitation',
    entityId: invitation.id,
    metadata: { email: input.email, role: input.role ?? 'member' },
  });

  return invitation;
}

export async function respondToInvitation(
  db: Db,
  token: string,
  userId: string,
  userEmail: string,
  action: 'accept' | 'decline',
): Promise<Invitation> {
  const invitation = await invitationRepo.findByToken(db, token);
  if (!invitation) {
    throw new AppError('Invalid invitation token', 404);
  }

  if (invitation.status !== 'pending') {
    throw new AppError(`Invitation has already been ${invitation.status}`, 400);
  }

  if (new Date(invitation.expiresAt) < new Date()) {
    await invitationRepo.updateStatus(db, invitation.id, 'expired');
    throw new AppError('Invitation has expired', 400);
  }

  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new ForbiddenError('This invitation was sent to a different email address');
  }

  const now = new Date();

  if (action === 'accept') {
    await collabRepo.addCollaborator(db, invitation.projectId, userId, invitation.role);
    await invitationRepo.updateStatus(db, invitation.id, 'accepted', { acceptedAt: now });

    logActivity(db, {
      projectId: invitation.projectId,
      userId,
      action: 'invitation_accepted',
      entityType: 'invitation',
      entityId: invitation.id,
      metadata: { role: invitation.role },
    });

    logActivity(db, {
      projectId: invitation.projectId,
      userId,
      action: 'collaborator_added',
      entityType: 'collaborator',
      entityId: userId,
      metadata: { role: invitation.role, via: 'invitation' },
    });
  } else {
    await invitationRepo.updateStatus(db, invitation.id, 'declined', { declinedAt: now });

    logActivity(db, {
      projectId: invitation.projectId,
      userId,
      action: 'invitation_declined',
      entityType: 'invitation',
      entityId: invitation.id,
    });
  }

  return { ...invitation, status: action === 'accept' ? 'accepted' : 'declined' };
}

export async function getMyPendingInvitations(
  db: Db,
  email: string,
): Promise<readonly Invitation[]> {
  // Lazy-expire overdue invitations
  await invitationRepo.expireOverdue(db, email);
  return invitationRepo.findPendingByEmail(db, email);
}

export async function getProjectInvitations(
  db: Db,
  projectId: string,
  userId: string,
): Promise<readonly Invitation[]> {
  await assertPermission(db, projectId, userId, 'data:read');
  return invitationRepo.findPendingByProjectId(db, projectId);
}

export async function cancelInvitation(
  db: Db,
  invitationId: string,
  userId: string,
): Promise<void> {
  const inv = await invitationRepo.findInvitationOwnerProjectId(db, invitationId);
  if (!inv) {
    throw new AppError('Invitation not found', 404);
  }
  if (inv.status !== 'pending') {
    throw new AppError('Only pending invitations can be cancelled', 400);
  }

  await assertPermission(db, inv.projectId, userId, 'collaborator:manage');
  await invitationRepo.cancelById(db, invitationId);

  logActivity(db, {
    projectId: inv.projectId,
    userId,
    action: 'invitation_cancelled',
    entityType: 'invitation',
    entityId: invitationId,
  });
}

export async function verifyToken(
  db: Db,
  token: string,
): Promise<{ valid: boolean; invitation: Invitation | null }> {
  const invitation = await invitationRepo.findByToken(db, token);
  if (!invitation) {
    return { valid: false, invitation: null };
  }

  if (invitation.status !== 'pending') {
    return { valid: false, invitation };
  }

  if (new Date(invitation.expiresAt) < new Date()) {
    await invitationRepo.updateStatus(db, invitation.id, 'expired');
    return { valid: false, invitation: { ...invitation, status: 'expired' } };
  }

  return { valid: true, invitation };
}
