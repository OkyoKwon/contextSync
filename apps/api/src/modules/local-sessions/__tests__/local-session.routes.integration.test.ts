import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../test-helpers/create-test-app.js';
import { authHeader } from '../../../test-helpers/auth-helper.js';

vi.mock('../local-session.service.js', () => ({
  listLocalDirectories: vi.fn(),
  listLocalSessions: vi.fn(),
  getLocalSessionDetail: vi.fn(),
  getProjectConversation: vi.fn(),
  browseDirectory: vi.fn(),
  findSessionFiles: vi.fn(),
  findFirstTimestamp: vi.fn(),
  countLocalSessionsByDate: vi.fn(),
}));

vi.mock('../local-session.sync.js', () => ({
  syncSessions: vi.fn(),
  recalculateTokenUsage: vi.fn(),
  getProjectSessionFiles: vi.fn(),
  getProjectDirectoryOwners: vi.fn(),
}));

import * as localService from '../local-session.service.js';
import { syncSessions } from '../local-session.sync.js';

const mockListDirs = vi.mocked(localService.listLocalDirectories);
const mockListSessions = vi.mocked(localService.listLocalSessions);
const mockGetDetail = vi.mocked(localService.getLocalSessionDetail);
const mockBrowse = vi.mocked(localService.browseDirectory);
const mockSyncSessions = vi.mocked(syncSessions);

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

describe('Local Session Routes Integration', () => {
  describe('GET /api/sessions/local/directories', () => {
    it('should return local directories', async () => {
      mockListDirs.mockResolvedValue([
        {
          path: '/Users/test/project',
          sessionCount: 3,
          lastActivityAt: '2025-01-01T00:00:00.000Z',
          isActive: false,
        },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/sessions/local/directories',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toHaveLength(1);
    });

    it('should return 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/sessions/local/directories',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/sessions/local/browse', () => {
    it('should browse directory', async () => {
      mockBrowse.mockResolvedValue([
        {
          name: 'src',
          path: '/Users/test/project/src',
          isDirectory: true,
        },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/sessions/local/browse',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toHaveLength(1);
    });
  });

  describe('GET /api/sessions/local', () => {
    it('should return 400 without projectId', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/sessions/local',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return sessions with projectId', async () => {
      mockListSessions.mockResolvedValue([]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/sessions/local?projectId=proj-1',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/sessions/local/:sessionId', () => {
    it('should return session detail', async () => {
      mockGetDetail.mockResolvedValue({
        sessionId: 'sess-1',
        projectPath: '/test',
        title: 'Test',
        branch: null,
        filePaths: [],
        messages: [],
        startedAt: null,
        lastModifiedAt: '2025-01-01T00:00:00.000Z',
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/sessions/local/sess-1',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should return 404 when not found', async () => {
      const err = new Error('Local session not found: nonexistent');
      (err as NodeJS.ErrnoException).code = 'NOT_FOUND';
      mockGetDetail.mockRejectedValue(err);

      const res = await app.inject({
        method: 'GET',
        url: '/api/sessions/local/nonexistent',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/projects/:projectId/sessions/sync', () => {
    it('should sync sessions', async () => {
      mockSyncSessions.mockResolvedValue({ synced: 2, skipped: 0 } as any);

      const res = await app.inject({
        method: 'POST',
        url: '/api/projects/proj-1/sessions/sync',
        headers: { authorization: await authHeader() },
        payload: { sessionIds: ['sess-1', 'sess-2'] },
      });

      expect(res.statusCode).toBe(201);
    });

    it('should return 400 with empty sessionIds', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/projects/proj-1/sessions/sync',
        headers: { authorization: await authHeader() },
        payload: { sessionIds: [] },
      });

      expect(res.statusCode).toBe(400);
    });
  });
});
