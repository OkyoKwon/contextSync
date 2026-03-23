import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../project.repository.js', () => ({
  createProject: vi.fn(),
  findProjectsWithTeamInfo: vi.fn(),
  findProjectByIdWithTeamInfo: vi.fn(),
  findProjectById: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  findProjectByJoinCode: vi.fn(),
  updateJoinCode: vi.fn(),
}));

vi.mock('../collaborator.repository.js', () => ({
  findCollaboratorByProjectAndUser: vi.fn(),
  findCollaboratorsByProjectId: vi.fn(),
  addCollaborator: vi.fn(),
  removeCollaborator: vi.fn(),
  isCollaborator: vi.fn(),
  updateCollaboratorDirectory: vi.fn(),
}));

vi.mock('../permission.helper.js', () => ({
  assertPermission: vi.fn(),
}));

vi.mock('../../activity/activity.service.js', () => ({
  logActivity: vi.fn(),
}));

vi.mock('../../../lib/join-code.js', () => ({
  generateJoinCode: vi.fn(() => 'ABC123'),
}));

import * as projectRepo from '../project.repository.js';
import * as collabRepo from '../collaborator.repository.js';
import { assertPermission } from '../permission.helper.js';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getCollaborators,
  setMyDirectory,
  assertProjectAccess,
  getUserRoleInProject,
  generateProjectJoinCode,
  deleteJoinCode,
  joinByCode,
} from '../project.service.js';
import { NotFoundError, ForbiddenError } from '../../../plugins/error-handler.plugin.js';

const mockCreateProject = projectRepo.createProject as ReturnType<typeof vi.fn>;
const mockFindProjectsWithTeamInfo = projectRepo.findProjectsWithTeamInfo as ReturnType<
  typeof vi.fn
>;
const mockFindProjectByIdWithTeamInfo = projectRepo.findProjectByIdWithTeamInfo as ReturnType<
  typeof vi.fn
>;
const mockFindProjectById = projectRepo.findProjectById as ReturnType<typeof vi.fn>;
const mockUpdateProject = projectRepo.updateProject as ReturnType<typeof vi.fn>;
const mockDeleteProject = projectRepo.deleteProject as ReturnType<typeof vi.fn>;
const mockFindProjectByJoinCode = projectRepo.findProjectByJoinCode as ReturnType<typeof vi.fn>;
const mockUpdateJoinCode = projectRepo.updateJoinCode as ReturnType<typeof vi.fn>;

const mockFindCollabByProjectAndUser = collabRepo.findCollaboratorByProjectAndUser as ReturnType<
  typeof vi.fn
>;
const mockFindCollabsByProjectId = collabRepo.findCollaboratorsByProjectId as ReturnType<
  typeof vi.fn
>;
const mockAddCollaborator = collabRepo.addCollaborator as ReturnType<typeof vi.fn>;
const mockIsCollaborator = collabRepo.isCollaborator as ReturnType<typeof vi.fn>;
const mockUpdateCollabDir = collabRepo.updateCollaboratorDirectory as ReturnType<typeof vi.fn>;
const mockAssertPermission = assertPermission as ReturnType<typeof vi.fn>;

const db = {} as any;

const makeProject = (overrides: Record<string, unknown> = {}) => ({
  id: 'proj-1',
  ownerId: 'user-1',
  name: 'Test Project',
  description: null,
  repoUrl: null,
  localDirectory: '/home/user/project',
  joinCode: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

const makeProjectWithTeamInfo = (overrides: Record<string, unknown> = {}) => ({
  ...makeProject(),
  collaboratorCount: 0,
  isTeam: false,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createProject', () => {
  it('should delegate to projectRepo.createProject', async () => {
    const input = { name: 'New Project' };
    const expected = makeProject({ name: 'New Project' });
    mockCreateProject.mockResolvedValue(expected);

    const result = await createProject(db, 'user-1', input as any);

    expect(mockCreateProject).toHaveBeenCalledWith(db, 'user-1', input);
    expect(result).toEqual(expected);
  });
});

describe('getProjects', () => {
  it('should return projects with myLocalDirectory for owner', async () => {
    const project = makeProjectWithTeamInfo({
      ownerId: 'user-1',
      localDirectory: '/home/owner/proj',
    });
    mockFindProjectsWithTeamInfo.mockResolvedValue([project]);

    // Mock the db query for collaborator directories
    const mockExecute = vi.fn().mockResolvedValue([]);
    const mockWhere2 = vi.fn().mockReturnValue({ execute: mockExecute });
    const mockWhere1 = vi.fn().mockReturnValue({ where: mockWhere2 });
    const mockSelect = vi.fn().mockReturnValue({ where: mockWhere1 });
    (db as any).selectFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const result = await getProjects(db, 'user-1');

    expect(result).toHaveLength(1);
    expect(result[0]?.myLocalDirectory).toBe('/home/owner/proj');
  });

  it('should return projects with myLocalDirectory from collaborator records', async () => {
    const project = makeProjectWithTeamInfo({
      ownerId: 'other-user',
      localDirectory: '/other/dir',
    });
    mockFindProjectsWithTeamInfo.mockResolvedValue([project]);

    const mockExecute = vi
      .fn()
      .mockResolvedValue([{ project_id: 'proj-1', local_directory: '/collab/dir' }]);
    const mockWhere2 = vi.fn().mockReturnValue({ execute: mockExecute });
    const mockWhere1 = vi.fn().mockReturnValue({ where: mockWhere2 });
    const mockSelect = vi.fn().mockReturnValue({ where: mockWhere1 });
    (db as any).selectFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const result = await getProjects(db, 'user-1');

    expect(result[0]?.myLocalDirectory).toBe('/collab/dir');
  });

  it('should return empty array when user has no projects', async () => {
    mockFindProjectsWithTeamInfo.mockResolvedValue([]);

    const result = await getProjects(db, 'user-1');

    expect(result).toEqual([]);
  });
});

describe('getProject', () => {
  it('should return project with myLocalDirectory for owner', async () => {
    const project = makeProjectWithTeamInfo({ ownerId: 'user-1', localDirectory: '/owner/dir' });
    mockFindProjectByIdWithTeamInfo.mockResolvedValue(project);
    mockIsCollaborator.mockResolvedValue(true);

    const result = await getProject(db, 'proj-1', 'user-1');

    expect(result.myLocalDirectory).toBe('/owner/dir');
  });

  it('should return project with collaborator localDirectory for non-owner', async () => {
    const project = makeProjectWithTeamInfo({ ownerId: 'other-user' });
    mockFindProjectByIdWithTeamInfo.mockResolvedValue(project);
    mockIsCollaborator.mockResolvedValue(true);
    mockFindCollabByProjectAndUser.mockResolvedValue({ localDirectory: '/collab/dir' });

    const result = await getProject(db, 'proj-1', 'user-1');

    expect(result.myLocalDirectory).toBe('/collab/dir');
  });

  it('should throw NotFoundError when project does not exist', async () => {
    mockFindProjectByIdWithTeamInfo.mockResolvedValue(null);

    await expect(getProject(db, 'nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when user has no access', async () => {
    const project = makeProjectWithTeamInfo({ ownerId: 'other-user' });
    mockFindProjectByIdWithTeamInfo.mockResolvedValue(project);
    mockIsCollaborator.mockResolvedValue(false);

    await expect(getProject(db, 'proj-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});

describe('updateProject', () => {
  it('should update project after permission check', async () => {
    const project = makeProject();
    const updated = makeProject({ name: 'Updated' });
    mockFindProjectById.mockResolvedValue(project);
    mockAssertPermission.mockResolvedValue(undefined);
    mockUpdateProject.mockResolvedValue(updated);

    const result = await updateProject(db, 'proj-1', 'user-1', { name: 'Updated' } as any);

    expect(mockAssertPermission).toHaveBeenCalledWith(db, 'proj-1', 'user-1', 'project:edit');
    expect(result).toEqual(updated);
  });

  it('should throw NotFoundError when project does not exist', async () => {
    mockFindProjectById.mockResolvedValue(null);

    await expect(updateProject(db, 'nonexistent', 'user-1', {} as any)).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe('deleteProject', () => {
  it('should delete project when user is owner', async () => {
    const project = makeProject({ ownerId: 'user-1' });
    mockFindProjectById.mockResolvedValue(project);

    await deleteProject(db, 'proj-1', 'user-1');

    expect(mockDeleteProject).toHaveBeenCalledWith(db, 'proj-1');
  });

  it('should throw NotFoundError when project does not exist', async () => {
    mockFindProjectById.mockResolvedValue(null);

    await expect(deleteProject(db, 'nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when user is not owner', async () => {
    const project = makeProject({ ownerId: 'other-user' });
    mockFindProjectById.mockResolvedValue(project);

    await expect(deleteProject(db, 'proj-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});

describe('getCollaborators', () => {
  it('should return collaborators when user has access', async () => {
    const project = makeProject({ ownerId: 'user-1' });
    const collabs = [{ id: 'c-1', userId: 'user-2', role: 'member' }];
    mockFindProjectById.mockResolvedValue(project);
    mockFindCollabsByProjectId.mockResolvedValue(collabs);

    const result = await getCollaborators(db, 'proj-1', 'user-1');

    expect(result).toEqual(collabs);
  });

  it('should throw NotFoundError when project does not exist', async () => {
    mockFindProjectById.mockResolvedValue(null);

    await expect(getCollaborators(db, 'nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
  });
});

describe('assertProjectAccess', () => {
  it('should return project when user is owner', async () => {
    const project = makeProject({ ownerId: 'user-1' });
    mockFindProjectById.mockResolvedValue(project);

    const result = await assertProjectAccess(db, 'proj-1', 'user-1');

    expect(result).toEqual(project);
  });

  it('should return project when user is collaborator', async () => {
    const project = makeProject({ ownerId: 'other-user' });
    mockFindProjectById.mockResolvedValue(project);
    mockIsCollaborator.mockResolvedValue(true);

    const result = await assertProjectAccess(db, 'proj-1', 'user-1');

    expect(result).toEqual(project);
  });

  it('should throw NotFoundError when project does not exist', async () => {
    mockFindProjectById.mockResolvedValue(null);

    await expect(assertProjectAccess(db, 'nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when user has no access', async () => {
    const project = makeProject({ ownerId: 'other-user' });
    mockFindProjectById.mockResolvedValue(project);
    mockIsCollaborator.mockResolvedValue(false);

    await expect(assertProjectAccess(db, 'proj-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});

describe('getUserRoleInProject', () => {
  it('should return owner when user is the project owner', async () => {
    mockFindProjectById.mockResolvedValue(makeProject({ ownerId: 'user-1' }));

    const result = await getUserRoleInProject(db, 'proj-1', 'user-1');

    expect(result).toBe('owner');
  });

  it('should return collaborator role when user is a collaborator', async () => {
    mockFindProjectById.mockResolvedValue(makeProject({ ownerId: 'other-user' }));
    mockFindCollabByProjectAndUser.mockResolvedValue({ role: 'member' });

    const result = await getUserRoleInProject(db, 'proj-1', 'user-1');

    expect(result).toBe('member');
  });

  it('should return null when project does not exist', async () => {
    mockFindProjectById.mockResolvedValue(null);

    const result = await getUserRoleInProject(db, 'nonexistent', 'user-1');

    expect(result).toBeNull();
  });

  it('should return null when user is not a member', async () => {
    mockFindProjectById.mockResolvedValue(makeProject({ ownerId: 'other-user' }));
    mockFindCollabByProjectAndUser.mockResolvedValue(null);

    const result = await getUserRoleInProject(db, 'proj-1', 'user-1');

    expect(result).toBeNull();
  });
});

describe('joinByCode', () => {
  it('should add user as collaborator when code is valid', async () => {
    const project = makeProject({ ownerId: 'other-user' });
    mockFindProjectByJoinCode.mockResolvedValue(project);
    mockFindCollabByProjectAndUser.mockResolvedValue(null);

    const result = await joinByCode(db, 'ABC123', 'user-1');

    expect(mockAddCollaborator).toHaveBeenCalledWith(db, 'proj-1', 'user-1', 'member');
    expect(result).toEqual(project);
  });

  it('should throw NotFoundError when join code is invalid', async () => {
    mockFindProjectByJoinCode.mockResolvedValue(null);

    await expect(joinByCode(db, 'INVALID', 'user-1')).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when user is the owner', async () => {
    const project = makeProject({ ownerId: 'user-1' });
    mockFindProjectByJoinCode.mockResolvedValue(project);

    await expect(joinByCode(db, 'ABC123', 'user-1')).rejects.toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError when user is already a collaborator', async () => {
    const project = makeProject({ ownerId: 'other-user' });
    mockFindProjectByJoinCode.mockResolvedValue(project);
    mockFindCollabByProjectAndUser.mockResolvedValue({ role: 'member' });

    await expect(joinByCode(db, 'ABC123', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});

describe('generateProjectJoinCode', () => {
  it('should generate a join code for the project owner', async () => {
    const project = makeProject({ ownerId: 'user-1' });
    const updated = makeProject({ joinCode: 'ABC123' });
    mockFindProjectById.mockResolvedValue(project);
    mockUpdateJoinCode.mockResolvedValue(updated);

    const result = await generateProjectJoinCode(db, 'proj-1', 'user-1');

    expect(mockUpdateJoinCode).toHaveBeenCalledWith(db, 'proj-1', 'ABC123');
    expect(result).toEqual(updated);
  });

  it('should throw ForbiddenError when user is not owner', async () => {
    mockFindProjectById.mockResolvedValue(makeProject({ ownerId: 'other-user' }));

    await expect(generateProjectJoinCode(db, 'proj-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});

describe('deleteJoinCode', () => {
  it('should remove join code when user is owner', async () => {
    mockFindProjectById.mockResolvedValue(makeProject({ ownerId: 'user-1' }));

    await deleteJoinCode(db, 'proj-1', 'user-1');

    expect(mockUpdateJoinCode).toHaveBeenCalledWith(db, 'proj-1', null);
  });

  it('should throw ForbiddenError when user is not owner', async () => {
    mockFindProjectById.mockResolvedValue(makeProject({ ownerId: 'other-user' }));

    await expect(deleteJoinCode(db, 'proj-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});

describe('setMyDirectory', () => {
  it('should update project localDirectory when user is owner', async () => {
    mockFindProjectById.mockResolvedValue(makeProject({ ownerId: 'user-1' }));
    mockFindCollabByProjectAndUser.mockResolvedValue(null);
    mockUpdateProject.mockResolvedValue(makeProject());

    await setMyDirectory(db, 'proj-1', 'user-1', '/new/dir');

    expect(mockUpdateProject).toHaveBeenCalledWith(db, 'proj-1', { localDirectory: '/new/dir' });
  });

  it('should update collaborator directory when user is member', async () => {
    mockFindProjectById.mockResolvedValue(makeProject({ ownerId: 'other-user' }));
    mockFindCollabByProjectAndUser.mockResolvedValue({ role: 'member' });

    await setMyDirectory(db, 'proj-1', 'user-1', '/member/dir');

    expect(mockUpdateCollabDir).toHaveBeenCalledWith(db, 'proj-1', 'user-1', '/member/dir');
  });

  it('should throw ForbiddenError when user is not a project member', async () => {
    mockFindProjectById.mockResolvedValue(null);

    await expect(setMyDirectory(db, 'proj-1', 'user-1', '/dir')).rejects.toThrow(ForbiddenError);
  });
});
