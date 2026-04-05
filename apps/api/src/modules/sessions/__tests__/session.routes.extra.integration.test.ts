import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../test-helpers/create-test-app.js';
import { authHeader } from '../../../test-helpers/auth-helper.js';

vi.mock('../session.service.js', () => ({
  getSessionsByProject: vi.fn(),
  getSessionDetail: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  getTimeline: vi.fn(),
  getDashboardStats: vi.fn(),
  getTeamStats: vi.fn(),
}));

vi.mock('../session-import.service.js', () => ({ importSession: vi.fn() }));
vi.mock('../session-export.service.js', () => ({ exportProjectAsMarkdown: vi.fn() }));
vi.mock('../session.repository.js', () => ({ findSessionById: vi.fn() }));
vi.mock('../token-usage.service.js', () => ({ getTokenUsageStats: vi.fn() }));

import * as sessionService from '../session.service.js';
import { findSessionById } from '../session.repository.js';
import * as tokenUsageService from '../token-usage.service.js';

const mockFindById = vi.mocked(findSessionById);
const mockUpdate = vi.mocked(sessionService.updateSession);
const mockDelete = vi.mocked(sessionService.deleteSession);
const mockTimeline = vi.mocked(sessionService.getTimeline);
const mockDashboard = vi.mocked(sessionService.getDashboardStats);
const mockTeamStats = vi.mocked(sessionService.getTeamStats);
const mockTokenUsage = vi.mocked(tokenUsageService.getTokenUsageStats);

const MOCK_SESSION = {
  id: 'sess-1',
  projectId: 'proj-1',
  userId: 'user-1',
  title: 'Test',
  source: 'manual' as const,
  status: 'active' as const,
  filePaths: [],
  moduleNames: [],
  branch: null,
  tags: [],
  metadata: {},
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

describe('Session Routes Extra Integration', () => {
  describe('PATCH /api/sessions/:sessionId', () => {
    it('should update session', async () => {
      mockFindById.mockResolvedValue(MOCK_SESSION as any);
      mockUpdate.mockResolvedValue({ ...MOCK_SESSION, title: 'Updated' });

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/sessions/sess-1',
        headers: { authorization: await authHeader() },
        payload: { title: 'Updated' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.title).toBe('Updated');
    });

    it('should return 404 when session not found', async () => {
      mockFindById.mockResolvedValue(null);
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/sessions/nonexistent',
        headers: { authorization: await authHeader() },
        payload: { title: 'X' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/sessions/:sessionId', () => {
    it('should delete session', async () => {
      mockFindById.mockResolvedValue(MOCK_SESSION as any);
      mockDelete.mockResolvedValue(undefined);
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/sessions/sess-1',
        headers: { authorization: await authHeader() },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.deleted).toBe(true);
    });

    it('should return 404 when not found', async () => {
      mockFindById.mockResolvedValue(null);
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/sessions/nonexistent',
        headers: { authorization: await authHeader() },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/projects/:projectId/timeline', () => {
    it('should return timeline', async () => {
      mockTimeline.mockResolvedValue({ entries: [], total: 0 });
      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/timeline',
        headers: { authorization: await authHeader() },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().meta).toBeDefined();
    });
  });

  describe('GET /api/projects/:projectId/stats', () => {
    it('should return dashboard stats', async () => {
      mockDashboard.mockResolvedValue({
        todaySessions: 3,
        weekSessions: 10,
        activeConflicts: 1,
        activeMembers: 2,
        hotFilePaths: [],
      });
      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/stats',
        headers: { authorization: await authHeader() },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.todaySessions).toBe(3);
    });
  });

  describe('GET /api/projects/:projectId/team-stats', () => {
    it('should return team stats', async () => {
      mockTeamStats.mockResolvedValue([]);
      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/team-stats',
        headers: { authorization: await authHeader() },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/projects/:projectId/token-usage', () => {
    it('should return token usage stats', async () => {
      mockTokenUsage.mockResolvedValue({
        totalTokens: 1000,
        totalCost: 0.01,
        totalMessages: 10,
        measuredMessages: 8,
        periodStart: '2025-01-01',
        periodEnd: '2025-01-07',
        modelBreakdown: [],
        dailyUsage: [],
      });
      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/token-usage?period=7d',
        headers: { authorization: await authHeader() },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.totalTokens).toBe(1000);
    });
  });
});
