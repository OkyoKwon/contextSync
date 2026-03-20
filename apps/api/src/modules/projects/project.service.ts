import type { Db } from '../../database/client.js';
import type { Project, CreateProjectInput, UpdateProjectInput, Collaborator } from '@context-sync/shared';
import { NotFoundError, ForbiddenError } from '../../plugins/error-handler.plugin.js';
import * as projectRepo from './project.repository.js';
import * as collabRepo from './collaborator.repository.js';

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
): Promise<readonly Project[]> {
  return projectRepo.findProjectsByUserId(db, userId);
}

export async function getProject(db: Db, projectId: string, userId: string): Promise<Project> {
  const project = await projectRepo.findProjectById(db, projectId);
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
  await assertAccess(db, project, userId);
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
  assertOwner(project, userId);
  await collabRepo.addCollaborator(db, projectId, targetUserId, role ?? 'member');
}

export async function removeCollaborator(
  db: Db,
  projectId: string,
  userId: string,
  targetUserId: string,
): Promise<void> {
  const project = await projectRepo.findProjectById(db, projectId);
  if (!project) throw new NotFoundError('Project');
  assertOwner(project, userId);
  await collabRepo.removeCollaborator(db, projectId, targetUserId);
}

export async function assertProjectAccess(db: Db, projectId: string, userId: string): Promise<Project> {
  const project = await projectRepo.findProjectById(db, projectId);
  if (!project) throw new NotFoundError('Project');
  await assertAccess(db, project, userId);
  return project;
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
