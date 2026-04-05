import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../test-helpers/create-test-app.js';
import { authHeader, DEFAULT_TEST_USER } from '../../../test-helpers/auth-helper.js';

vi.mock('../session.service.js', () => ({
  getSessionsByProject: vi.fn(),
  getSessionDetail: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
}));

vi.mock('../session-import.service.js', () => ({
  importSession: vi.fn(),
}));

vi.mock('../session-export.service.js', () => ({
  exportProjectAsMarkdown: vi.fn(),
}));

vi.mock('../session.repository.js', () => ({
  findSessionById: vi.fn(),
}));

vi.mock('../token-usage.service.js', () => ({
  getTokenUsageByProject: vi.fn(),
  getTokenUsageBySessions: vi.fn(),
}));

import * as sessionService from '../session.service.js';
import { findSessionById } from '../session.repository.js';
import { exportProjectAsMarkdown } from '../session-export.service.js';

const mockGetSessionsByProject = vi.mocked(sessionService.getSessionsByProject);
const mockGetSessionDetail = vi.mocked(sessionService.getSessionDetail);
const mockFindSessionById = vi.mocked(findSessionById);
const mockExportMarkdown = vi.mocked(exportProjectAsMarkdown);

const MOCK_SESSION = {
  id: 'sess-1',
  projectId: 'proj-1',
  userId: DEFAULT_TEST_USER.userId,
  title: 'Test Session',
  source: 'manual' as const,
  status: 'active' as const,
  filePaths: [],
  moduleNames: [],
  branch: null,
  tags: [],
  metadata: {},
  messages: [],
  user: { name: 'Test User', avatarUrl: null },
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

describe('Session Routes Integration', () => {
  describe('GET /api/projects/:projectId/sessions', () => {
    it('should return paginated sessions', async () => {
      mockGetSessionsByProject.mockResolvedValue({
        sessions: [MOCK_SESSION],
        total: 1,
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/sessions',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.meta).toBeDefined();
    });

    it('should return 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/sessions',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/sessions/:sessionId', () => {
    it('should return session detail', async () => {
      mockFindSessionById.mockResolvedValue(MOCK_SESSION as any);
      mockGetSessionDetail.mockResolvedValue(MOCK_SESSION);

      const res = await app.inject({
        method: 'GET',
        url: '/api/sessions/sess-1',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.id).toBe('sess-1');
    });

    it('should return 404 when session not found', async () => {
      mockFindSessionById.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/sessions/nonexistent',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/projects/:projectId/sessions/export/markdown', () => {
    it('should export markdown file', async () => {
      mockExportMarkdown.mockResolvedValue({
        markdown: '# Sessions',
        projectName: 'Test Project',
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/sessions/export/markdown',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/markdown');
      expect(res.headers['content-disposition']).toContain('attachment');
    });
  });
});
