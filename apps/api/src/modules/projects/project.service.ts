import type { Db } from '../../database/client.js';
import type { Project, CreateProjectInput, UpdateProjectInput, ProjectWithTeamInfo, Collaborator } from '@context-sync/shared';
import { NotFoundError, ForbiddenError } from '../../plugins/error-handler.plugin.js';
import * as projectRepo from './project.repository.js';
import * as collabRepo from './collaborator.repository.js';
import { logActivity } from '../activity/activity.service.js';
import { assertPermission } from './permission.helper.js';

export async function createProject(
  db: Db,
  userId: string,
  input: CreateProjectInput,
): Promise<Project> {
  return projectRepo.createProject(db, userId, input);
}

export async function getProjects(
  db: Db,
  userId: string,
): Promise<readonly ProjectWithTeamInfo[]> {
  return projectRepo.findProjectsWithTeamInfo(db, userId);
}

export async function getProject(
  db: Db,
  projectId: string,
  userId: string,
): Promise<ProjectWithTeamInfo> {
  const project = await projectRepo.findProjectByIdWithTeamInfo(db, projectId);
  if (!project) throw new NotFoundError('Project');
  await assertAccess(db, project, userId);
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
  await assertPermission(db, projectId, userId, 'project:edit');
  return projectRepo.updateProject(db, projectId, input);
}

export async function deleteProject(
  db: Db,
  projectId: string,
  userId: string,
): Promise<void> {
  const project = await projectRepo.findProjectById(db, projectId);
  if (!project) throw new NotFoundError('Project');
  assertOwner(project, userId);
  await projectRepo.deleteProject(db, projectId);
}

export async function getCollaborators(
  db: Db,
  projectId: string,
  userId: string,
): Promise<readonly Collaborator[]> {
  const project = await projectRepo.findProjectById(db, projectId);
  if (!project) throw new NotFoundError('Project');
  await assertAccess(db, project, userId);
  return collabRepo.findCollaboratorsByProjectId(db, projectId);
}

export async function addCollaborator(
  db: Db,
  projectId: string,
  userId: string,
  targetUserId: string,
  role?: string,
): Promise<void> {
  const project = await projectRepo.findProjectById(db, projectId);
  if (!project) throw new NotFoundError('Project');
  await assertPermission(db, projectId, userId, 'collaborator:manage');
  await collabRepo.addCollaborator(db, projectId, targetUserId, role ?? 'member');
  logActivity(db, {
    projectId,
    userId,
    action: 'collaborator_added',
    entityType: 'collaborator',
    entityId: targetUserId,
    metadata: { role: role ?? 'member' },
  });
}

export async function removeCollaborator(
  db: Db,
  projectId: string,
  userId: string,
  targetUserId: string,
): Promise<void> {
  const project = await projectRepo.findProjectById(db, projectId);
  if (!project) throw new NotFoundError('Project');
  await assertPermission(db, projectId, userId, 'collaborator:manage');
  await collabRepo.removeCollaborator(db, projectId, targetUserId);
  logActivity(db, {
    projectId,
    userId,
    action: 'collaborator_removed',
    entityType: 'collaborator',
    entityId: targetUserId,
  });
}

export async function assertProjectAccess(db: Db, projectId: string, userId: string): Promise<Project> {
  const project = await projectRepo.findProjectById(db, projectId);
  if (!project) throw new NotFoundError('Project');
  await assertAccess(db, project, userId);
  return project;
}

export async function getUserRoleInProject(
  db: Db,
  projectId: string,
  userId: string,
): Promise<'owner' | 'admin' | 'member' | null> {
  const project = await projectRepo.findProjectById(db, projectId);
  if (!project) return null;
  if (project.ownerId === userId) return 'owner';
  const collab = await collabRepo.findCollaboratorByProjectAndUser(db, projectId, userId);
  if (!collab) return null;
  return collab.role as 'admin' | 'member';
}

async function assertAccess(db: Db, project: Project, userId: string): Promise<void> {
  if (project.ownerId === userId) return;
  const hasAccess = await collabRepo.isCollaborator(db, project.id, userId);
  if (!hasAccess) throw new ForbiddenError('Not a project owner or collaborator');
}

function assertOwner(project: Project, userId: string): void {
  if (project.ownerId !== userId) {
    throw new ForbiddenError('Not the project owner');
  }
}
