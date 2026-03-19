import type { Db } from '../../database/client.js';
import type { Team, TeamMember, CreateTeamInput, UpdateTeamInput } from '@context-sync/shared';
import { AppError, NotFoundError, ForbiddenError } from '../../plugins/error-handler.plugin.js';
import * as teamRepo from './team.repository.js';

export async function createTeam(db: Db, input: CreateTeamInput, ownerId: string): Promise<Team> {
  if (!input.name.trim()) {
    throw new AppError('Team name is required');
  }
  if (!input.slug.trim() || !/^[a-z0-9-]+$/.test(input.slug)) {
    throw new AppError('Slug must contain only lowercase letters, numbers, and hyphens');
  }
  return teamRepo.createTeam(db, input, ownerId);
}

export async function getTeamsByUser(db: Db, userId: string): Promise<readonly Team[]> {
  return teamRepo.findTeamsByUserId(db, userId);
}

export async function getTeam(db: Db, teamId: string, userId: string): Promise<Team> {
  await assertTeamMember(db, teamId, userId);
  const team = await teamRepo.findTeamById(db, teamId);
  if (!team) throw new NotFoundError('Team');
  return team;
}

export async function updateTeam(
  db: Db,
  teamId: string,
  userId: string,
  input: UpdateTeamInput,
): Promise<Team> {
  await assertTeamMember(db, teamId, userId);
  return teamRepo.updateTeam(db, teamId, {
    name: input.name,
    settings: input.settings as Record<string, unknown> | undefined,
  });
}

export async function getTeamMembers(
  db: Db,
  teamId: string,
  userId: string,
): Promise<readonly TeamMember[]> {
  await assertTeamMember(db, teamId, userId);
  return teamRepo.findTeamMembers(db, teamId);
}

export async function addMember(
  db: Db,
  teamId: string,
  requesterId: string,
  targetUserId: string,
  role?: string,
): Promise<void> {
  await assertTeamMember(db, teamId, requesterId);
  await teamRepo.addTeamMember(db, teamId, targetUserId, role);
}

export async function removeMember(
  db: Db,
  teamId: string,
  requesterId: string,
  targetUserId: string,
): Promise<void> {
  await assertTeamMember(db, teamId, requesterId);
  await teamRepo.removeTeamMember(db, teamId, targetUserId);
}

async function assertTeamMember(db: Db, teamId: string, userId: string): Promise<void> {
  const isMember = await teamRepo.isTeamMember(db, teamId, userId);
  if (!isMember) throw new ForbiddenError('Not a team member');
}
