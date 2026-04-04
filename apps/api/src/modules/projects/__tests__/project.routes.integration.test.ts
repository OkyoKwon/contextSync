import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../test-helpers/create-test-app.js';
import {
  authHeader,
  DEFAULT_TEST_USER,
  SECOND_TEST_USER,
} from '../../../test-helpers/auth-helper.js';

vi.mock('../project.service.js', () => ({
  createProject: vi.fn(),
  getProjects: vi.fn(),
  getProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  setMyDirectory: vi.fn(),
  getCollaborators: vi.fn(),
  getCollaboratorDataSummary: vi.fn(),
  removeCollaborator: vi.fn(),
  generateProjectJoinCode: vi.fn(),
  regenerateJoinCode: vi.fn(),
  deleteJoinCode: vi.fn(),
  joinByCode: vi.fn(),
}));

import * as projectService from '../project.service.js';

const mockCreateProject = vi.mocked(projectService.createProject);
const mockGetProjects = vi.mocked(projectService.getProjects);
const mockGetProject = vi.mocked(projectService.getProject);
const mockUpdateProject = vi.mocked(projectService.updateProject);
const mockDeleteProject = vi.mocked(projectService.deleteProject);
const mockJoinByCode = vi.mocked(projectService.joinByCode);

const MOCK_PROJECT = {
  id: 'proj-1',
  name: 'Test Project',
  description: null,
  ownerId: DEFAULT_TEST_USER.userId,
  repoUrl: null,
  localDirectory: null,
  joinCode: null,
  databaseMode: 'local' as const,
  collaborators: [],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Project Routes Integration', () => {
  describe('POST /api/projects', () => {
    it('should create project and return 201', async () => {
      mockCreateProject.mockResolvedValue(MOCK_PROJECT);

      const res = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: { authorization: await authHeader() },
        payload: { name: 'Test Project' },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Test Project');
    });

    it('should return error when name is empty', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: { authorization: await authHeader() },
        payload: { name: '' },
      });

      // Zod validation throws → error handler catches as 500
      expect(res.json().success).toBe(false);
    });

    it('should return 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: { name: 'Test' },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/projects', () => {
    it('should return projects list', async () => {
      mockGetProjects.mockResolvedValue([MOCK_PROJECT]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });
  });

  describe('GET /api/projects/:projectId', () => {
    it('should return project detail', async () => {
      mockGetProject.mockResolvedValue(MOCK_PROJECT);

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.id).toBe('proj-1');
    });
  });

  describe('PATCH /api/projects/:projectId', () => {
    it('should update project', async () => {
      const updated = { ...MOCK_PROJECT, name: 'Updated' };
      mockUpdateProject.mockResolvedValue(updated);

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/projects/proj-1',
        headers: { authorization: await authHeader() },
        payload: { name: 'Updated' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.name).toBe('Updated');
    });
  });

  describe('DELETE /api/projects/:projectId', () => {
    it('should delete project', async () => {
      mockDeleteProject.mockResolvedValue(undefined);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/projects/proj-1',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/projects/proj-1',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/projects/join', () => {
    it('should join project with valid code', async () => {
      mockJoinByCode.mockResolvedValue(MOCK_PROJECT);

      const res = await app.inject({
        method: 'POST',
        url: '/api/projects/join',
        headers: { authorization: await authHeader() },
        payload: { code: 'ABCD1234' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.id).toBe('proj-1');
    });

    it('should return error when code is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/projects/join',
        headers: { authorization: await authHeader() },
        payload: {},
      });

      expect(res.json().success).toBe(false);
    });
  });
});
