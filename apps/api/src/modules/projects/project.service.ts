import type { Db } from '../../database/client.js';
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectWithTeamInfo,
  Collaborator,
} from '@context-sync/shared';
import { NotFoundError, ForbiddenError } from '../../plugins/error-handler.plugin.js';
import * as projectRepo from './project.repository.js';
import * as collabRepo from './collaborator.repository.js';
import { logActivity } from '../activity/activity.service.js';
import { assertPermission } from './permission.helper.js';
import { generateJoinCode as generateCode } from '../../lib/join-code.js';

export async function createProject(
  db: Db,
  userId: string,
  input: CreateProjectInput,
): Promise<Project> {
  return projectRepo.createProject(db, userId, input);
}

export async function getProjects(db: Db, userId: string): Promise<readonly ProjectWithTeamInfo[]> {
  const projects = await projectRepo.findProjectsWithTeamInfo(db, userId);

  // Fetch this user's collaborator directories for all projects in one query
  const projectIds = projects.map((p) => p.id);
  const collabDirs =
    projectIds.length > 0
      ? await db
          .selectFrom('project_collaborators')
          .select(['project_id', 'local_directory'])
          .where('user_id', '=', userId)
          .where('project_id', 'in', projectIds)
          .execute()
      : [];

  const collabDirMap = new Map(collabDirs.map((r) => [r.project_id, r.local_directory]));

  return projects.map((project) => ({
    ...project,
    myLocalDirectory:
      project.ownerId === userId ? project.localDirectory : (collabDirMap.get(project.id) ?? null),
  }));
}

export async function getProject(
  db: Db,
  projectId: string,
  userId: string,
): Promise<ProjectWithTeamInfo> {
  const project = await projectRepo.findProjectByIdWithTeamInfo(db, projectId);
  if (!project) throw new NotFoundError('Project');
  await assertAccess(db, project, userId);

  if (project.ownerId === userId) {
    return { ...project, myLocalDirectory: project.localDirectory };
  }

  const collab = await collabRepo.findCollaboratorByProjectAndUser(db, projectId, userId);
  return { ...project, myLocalDirectory: collab?.localDirectory ?? null };
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

export async function deleteProject(db: Db, projectId: string, userId: string): Promise<void> {
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

export async function setMyDirectory(
  db: Db,
  projectId: string,
  userId: string,
  localDirectory: string | null,
): Promise<void> {
  const role = await getUserRoleInProject(db, projectId, userId);
  if (!role) throw new ForbiddenError('Not a project member');

  if (role === 'owner') {
    await projectRepo.updateProject(db, projectId, { localDirectory });
  } else {
    await collabRepo.updateCollaboratorDirectory(db, projectId, userId, localDirectory);
  }

  logActivity(db, {
    projectId,
    userId,
    action: 'directory_updated',
    entityType: 'project',
    entityId: projectId,
    metadata: { localDirectory },
  });
}

export async function assertProjectAccess(
  db: Db,
  projectId: string,
  userId: string,
): Promise<Project> {
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

// --- Join Code ---

export async function generateProjectJoinCode(
  db: Db,
  projectId: string,
  userId: string,
): Promise<Project> {
  const project = await projectRepo.findProjectById(db, projectId);
  if (!project) throw new NotFoundError('Project');
  assertOwner(project, userId);
  const code = generateCode();
  return projectRepo.updateJoinCode(db, projectId, code);
}

export async function regenerateJoinCode(
  db: Db,
  projectId: string,
  userId: string,
): Promise<Project> {
  const project = await projectRepo.findProjectById(db, projectId);
  if (!project) throw new NotFoundError('Project');
  assertOwner(project, userId);
  const code = generateCode();
  return projectRepo.updateJoinCode(db, projectId, code);
}

export async function deleteJoinCode(db: Db, projectId: string, userId: string): Promise<void> {
  const project = await projectRepo.findProjectById(db, projectId);
  if (!project) throw new NotFoundError('Project');
  assertOwner(project, userId);
  await projectRepo.updateJoinCode(db, projectId, null);
}

export async function joinByCode(db: Db, code: string, userId: string): Promise<Project> {
  const project = await projectRepo.findProjectByJoinCode(db, code);
  if (!project) throw new NotFoundError('Invalid join code');

  if (project.ownerId === userId) {
    throw new ForbiddenError('You are already the owner of this project');
  }

  const existing = await collabRepo.findCollaboratorByProjectAndUser(db, project.id, userId);
  if (existing) {
    throw new ForbiddenError('You are already a collaborator on this project');
  }

  await collabRepo.addCollaborator(db, project.id, userId, 'member');

  logActivity(db, {
    projectId: project.id,
    userId,
    action: 'collaborator_joined',
    entityType: 'collaborator',
    entityId: userId,
    metadata: { method: 'join_code' },
  });

  return project;
}

// --- Helpers ---

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
