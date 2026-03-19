import type { Db } from '../../database/client.js';
import type { Project, CreateProjectInput, UpdateProjectInput } from '@context-sync/shared';
import { NotFoundError } from '../../plugins/error-handler.plugin.js';
import { isTeamMember } from '../teams/team.repository.js';
import { ForbiddenError } from '../../plugins/error-handler.plugin.js';
import * as projectRepo from './project.repository.js';

export async function createProject(
  db: Db,
  teamId: string,
  userId: string,
  input: CreateProjectInput,
): Promise<Project> {
  await assertTeamAccess(db, teamId, userId);
  return projectRepo.createProject(db, teamId, input);
}

export async function getProjectsByTeam(
  db: Db,
  teamId: string,
  userId: string,
): Promise<readonly Project[]> {
  await assertTeamAccess(db, teamId, userId);
  return projectRepo.findProjectsByTeamId(db, teamId);
}

export async function getProject(db: Db, projectId: string, userId: string): Promise<Project> {
  const project = await projectRepo.findProjectById(db, projectId);
  if (!project) throw new NotFoundError('Project');
  await assertTeamAccess(db, project.teamId, userId);
  return project;
}

export async function updateProject(
  db: Db,
  projectId: string,
  userId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const project = await projectRepo.findProjectById(db, projectId);
  if (!project) throw new NotFoundError('Project');
  await assertTeamAccess(db, project.teamId, userId);
  return projectRepo.updateProject(db, projectId, input);
}

export async function assertProjectAccess(db: Db, projectId: string, userId: string): Promise<Project> {
  const project = await projectRepo.findProjectById(db, projectId);
  if (!project) throw new NotFoundError('Project');
  await assertTeamAccess(db, project.teamId, userId);
  return project;
}

async function assertTeamAccess(db: Db, teamId: string, userId: string): Promise<void> {
  const isMember = await isTeamMember(db, teamId, userId);
  if (!isMember) throw new ForbiddenError('Not a team member');
}
