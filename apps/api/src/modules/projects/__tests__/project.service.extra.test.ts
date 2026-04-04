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
  updateDatabaseMode: vi.fn(),
}));

vi.mock('../collaborator.repository.js', () => ({
  findCollaboratorsByProjectId: vi.fn(),
  findCollaboratorByProjectAndUser: vi.fn(),
  addCollaborator: vi.fn(),
  removeCollaborator: vi.fn(),
  updateCollaboratorDirectory: vi.fn(),
  deleteCollaboratorData: vi.fn(),
  getCollaboratorDataSummary: vi.fn(),
}));

vi.mock('../../activity/activity.service.js', () => ({
  logActivity: vi.fn(),
}));

vi.mock('../permission.helper.js', () => ({
  assertPermission: vi.fn(),
}));

vi.mock('../../auth/auth.service.js', () => ({
  findUserById: vi.fn(),
}));

vi.mock('../../../lib/join-code.js', () => ({
  generateJoinCode: vi.fn(() => 'ABCD1234'),
}));

vi.mock('../../../lib/user-sync.js', () => ({
  syncUserToRemote: vi.fn(),
}));

vi.mock('../../../lib/project-sync.js', () => ({
  syncProjectToRemote: vi.fn(),
}));

import * as projectRepo from '../project.repository.js';
import * as collabRepo from '../collaborator.repository.js';
import { findUserById } from '../../auth/auth.service.js';
import {
  getCollaborators,
  removeCollaborator,
  setMyDirectory,
  generateProjectJoinCode,
  regenerateJoinCode,
  deleteJoinCode,
  joinByCode,
  getUserRoleInProject,
  assertProjectAccess,
  getCollaboratorDataSummary,
} from '../project.service.js';
import { NotFoundError, ForbiddenError, AppError } from '../../../plugins/error-handler.plugin.js';

const mockFindProjectById = vi.mocked(projectRepo.findProjectById);
const mockFindByJoinCode = vi.mocked(projectRepo.findProjectByJoinCode);
const mockUpdateJoinCode = vi.mocked(projectRepo.updateJoinCode);
const mockUpdateProject = vi.mocked(projectRepo.updateProject);
const mockFindCollabs = vi.mocked(collabRepo.findCollaboratorsByProjectId);
const mockFindCollab = vi.mocked(collabRepo.findCollaboratorByProjectAndUser);
const mockAddCollab = vi.mocked(collabRepo.addCollaborator);
const mockRemoveCollab = vi.mocked(collabRepo.removeCollaborator);
const mockUpdateCollabDir = vi.mocked(collabRepo.updateCollaboratorDirectory);
const mockDeleteCollabData = vi.mocked(collabRepo.deleteCollaboratorData);
const mockGetCollabSummary = vi.mocked(collabRepo.getCollaboratorDataSummary);
const mockFindUserById = vi.mocked(findUserById);

const db = {} as any;

const makeProject = (overrides: Record<string, unknown> = {}) => ({
  id: 'proj-1',
  ownerId: 'owner-1',
  name: 'Test',
  description: null,
  repoUrl: null,
  localDirectory: '/test',
  joinCode: null,
  databaseMode: 'local' as const,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

const makeCollab = (overrides: Record<string, unknown> = {}) => ({
  id: 'collab-1',
  projectId: 'proj-1',
  userId: 'user-2',
  role: 'member',
  localDirectory: null,
  addedAt: '2025-01-01T00:00:00.000Z',
  userName: 'User 2',
  userEmail: 'user2@test.com',
  userAvatarUrl: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generateProjectJoinCode', () => {
  it('should generate join code for owner', async () => {
    mockFindProjectById.mockResolvedValue(makeProject());
    mockUpdateJoinCode.mockResolvedValue(makeProject({ joinCode: 'ABCD1234' }));

    const result = await generateProjectJoinCode(db, 'proj-1', 'owner-1');
    expect(result.joinCode).toBe('ABCD1234');
  });

  it('should throw NotFoundError when project not found', async () => {
    mockFindProjectById.mockResolvedValue(null);
    await expect(generateProjectJoinCode(db, 'proj-1', 'owner-1')).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError for non-owner', async () => {
    mockFindProjectById.mockResolvedValue(makeProject());
    await expect(generateProjectJoinCode(db, 'proj-1', 'user-2')).rejects.toThrow(ForbiddenError);
  });
});

describe('regenerateJoinCode', () => {
  it('should regenerate for owner', async () => {
    mockFindProjectById.mockResolvedValue(makeProject({ joinCode: 'OLD' }));
    mockUpdateJoinCode.mockResolvedValue(makeProject({ joinCode: 'ABCD1234' }));

    const result = await regenerateJoinCode(db, 'proj-1', 'owner-1');
    expect(result.joinCode).toBe('ABCD1234');
  });
});

describe('deleteJoinCode', () => {
  it('should set join code to null', async () => {
    mockFindProjectById.mockResolvedValue(makeProject({ joinCode: 'ABC' }));
    mockUpdateJoinCode.mockResolvedValue(makeProject({ joinCode: null }));

    await deleteJoinCode(db, 'proj-1', 'owner-1');
    expect(mockUpdateJoinCode).toHaveBeenCalledWith(db, 'proj-1', null);
  });
});

describe('joinByCode', () => {
  it('should join project with valid code', async () => {
    const project = makeProject({ joinCode: 'CODE' });
    mockFindByJoinCode.mockResolvedValue(project);
    mockFindCollab.mockResolvedValue(null);

    const result = await joinByCode(db, 'CODE', 'user-2');
    expect(mockAddCollab).toHaveBeenCalledWith(db, 'proj-1', 'user-2', 'member');
  });

  it('should throw NotFoundError for invalid code', async () => {
    mockFindByJoinCode.mockResolvedValue(null);
    await expect(joinByCode(db, 'INVALID', 'user-2')).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when user is owner', async () => {
    mockFindByJoinCode.mockResolvedValue(makeProject());
    await expect(joinByCode(db, 'CODE', 'owner-1')).rejects.toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError when already collaborator', async () => {
    mockFindByJoinCode.mockResolvedValue(makeProject());
    mockFindCollab.mockResolvedValue(makeCollab());
    await expect(joinByCode(db, 'CODE', 'user-2')).rejects.toThrow(ForbiddenError);
  });
});

describe('removeCollaborator', () => {
  it('should throw when removing self', async () => {
    await expect(removeCollaborator(db, 'proj-1', 'user-1', 'user-1')).rejects.toThrow(AppError);
  });

  it('should remove collaborator without data deletion', async () => {
    mockFindProjectById.mockResolvedValue(makeProject());
    mockFindCollab.mockResolvedValue(makeCollab({ userId: 'user-2' }));

    const result = await removeCollaborator(db, 'proj-1', 'owner-1', 'user-2');
    expect(result).toBeNull();
    expect(mockRemoveCollab).toHaveBeenCalledWith(db, 'proj-1', 'user-2');
  });

  it('should delete data when requested', async () => {
    mockFindProjectById.mockResolvedValue(makeProject());
    mockFindCollab.mockResolvedValue(makeCollab({ userId: 'user-2' }));
    mockDeleteCollabData.mockResolvedValue({ sessions: 5, messages: 50 } as any);

    const result = await removeCollaborator(db, 'proj-1', 'owner-1', 'user-2', true);
    expect(result).toEqual({ sessions: 5, messages: 50 });
  });
});

describe('setMyDirectory', () => {
  it('should update project localDirectory for owner', async () => {
    mockFindProjectById.mockResolvedValue(makeProject());
    mockFindCollab.mockResolvedValue(null);

    await setMyDirectory(db, 'proj-1', 'owner-1', '/new/path');
    expect(mockUpdateProject).toHaveBeenCalledWith(db, 'proj-1', { localDirectory: '/new/path' });
  });

  it('should update collaborator directory for non-owner', async () => {
    mockFindProjectById.mockResolvedValue(makeProject());
    mockFindCollab.mockResolvedValue(makeCollab());

    await setMyDirectory(db, 'proj-1', 'user-2', '/collab/path');
    expect(mockUpdateCollabDir).toHaveBeenCalledWith(db, 'proj-1', 'user-2', '/collab/path');
  });

  it('should throw ForbiddenError for non-member', async () => {
    mockFindProjectById.mockResolvedValue(null);
    await expect(setMyDirectory(db, 'proj-1', 'stranger', '/path')).rejects.toThrow();
  });
});

describe('getUserRoleInProject', () => {
  it('should return owner for project owner', async () => {
    mockFindProjectById.mockResolvedValue(makeProject());
    const role = await getUserRoleInProject(db, 'proj-1', 'owner-1');
    expect(role).toBe('owner');
  });

  it('should return member for collaborator', async () => {
    mockFindProjectById.mockResolvedValue(makeProject());
    mockFindCollab.mockResolvedValue(makeCollab({ role: 'member' }));
    const role = await getUserRoleInProject(db, 'proj-1', 'user-2');
    expect(role).toBe('member');
  });

  it('should return null for non-member', async () => {
    mockFindProjectById.mockResolvedValue(makeProject());
    mockFindCollab.mockResolvedValue(null);
    const role = await getUserRoleInProject(db, 'proj-1', 'stranger');
    expect(role).toBeNull();
  });

  it('should return null when project not found', async () => {
    mockFindProjectById.mockResolvedValue(null);
    const role = await getUserRoleInProject(db, 'nonexistent', 'user-1');
    expect(role).toBeNull();
  });
});

describe('assertProjectAccess', () => {
  it('should return project for owner', async () => {
    const project = makeProject();
    mockFindProjectById.mockResolvedValue(project);
    mockFindCollab.mockResolvedValue(null);
    // owner access
    const result = await assertProjectAccess(db, 'proj-1', 'owner-1');
    expect(result.id).toBe('proj-1');
  });

  it('should throw NotFoundError when project not found', async () => {
    mockFindProjectById.mockResolvedValue(null);
    await expect(assertProjectAccess(db, 'nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
  });
});

describe('getCollaboratorDataSummary', () => {
  it('should return summary for collaborator', async () => {
    mockFindProjectById.mockResolvedValue(makeProject());
    mockFindCollab.mockResolvedValue(makeCollab({ userName: 'User2' }));
    mockGetCollabSummary.mockResolvedValue({ sessions: 5, messages: 100 } as any);

    const result = await getCollaboratorDataSummary(db, 'proj-1', 'owner-1', 'user-2');
    expect(result.userId).toBe('user-2');
    expect(result.userName).toBe('User2');
  });

  it('should throw NotFoundError when collaborator not found', async () => {
    mockFindProjectById.mockResolvedValue(makeProject());
    mockFindCollab.mockResolvedValue(null);
    await expect(getCollaboratorDataSummary(db, 'proj-1', 'owner-1', 'stranger')).rejects.toThrow(
      NotFoundError,
    );
  });
});
