import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../test-helpers/create-test-app.js';
import { authHeader } from '../../../test-helpers/auth-helper.js';

vi.mock('../conflict.service.js', () => ({
  getConflictsByProject: vi.fn(),
  getConflictDetail: vi.fn(),
  updateConflictStatus: vi.fn(),
  batchResolveConflicts: vi.fn(),
  getConflictOverview: vi.fn(),
  aiVerifyConflict: vi.fn(),
  assignReviewer: vi.fn(),
  addReviewNotes: vi.fn(),
}));

vi.mock('../conflict.repository.js', () => ({
  findConflictById: vi.fn(),
}));

vi.mock('../../auth/auth.service.js', () => ({
  findOrCreateByEmail: vi.fn(),
  findOrCreateByName: vi.fn(),
  findUserById: vi.fn(),
  updateUserPlan: vi.fn(),
  updateApiKey: vi.fn(),
  deleteApiKey: vi.fn(),
  saveSupabaseToken: vi.fn(),
  deleteSupabaseToken: vi.fn(),
  getUserApiKey: vi.fn(),
}));

import * as conflictService from '../conflict.service.js';
import { findConflictById } from '../conflict.repository.js';

const mockGetConflictsByProject = vi.mocked(conflictService.getConflictsByProject);
const mockGetConflictDetail = vi.mocked(conflictService.getConflictDetail);
const mockUpdateConflictStatus = vi.mocked(conflictService.updateConflictStatus);
const mockBatchResolve = vi.mocked(conflictService.batchResolveConflicts);
const mockFindConflictById = vi.mocked(findConflictById);

const MOCK_CONFLICT = {
  id: 'conflict-1',
  projectId: 'proj-1',
  sessionAId: 'sess-a',
  sessionBId: 'sess-b',
  conflictType: 'file' as const,
  severity: 'warning' as const,
  status: 'detected' as const,
  description: 'Test conflict',
  overlappingPaths: ['src/index.ts'],
  diffData: {},
  resolvedBy: null,
  resolvedAt: null,
  reviewerId: null,
  reviewerName: null,
  reviewNotes: null,
  assignedAt: null,
  aiVerdict: null,
  aiConfidence: null,
  aiOverlapType: null,
  aiSummary: null,
  aiRiskAreas: null,
  aiRecommendation: null,
  aiRecommendationDetail: null,
  aiAnalyzedAt: null,
  aiModelUsed: null,
  createdAt: '2025-01-01T00:00:00.000Z',
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

describe('Conflict Routes Integration', () => {
  describe('GET /api/projects/:projectId/conflicts', () => {
    it('should return paginated conflicts', async () => {
      mockGetConflictsByProject.mockResolvedValue({
        conflicts: [MOCK_CONFLICT],
        total: 1,
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/conflicts',
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
        url: '/api/projects/proj-1/conflicts',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/conflicts/:conflictId', () => {
    it('should return conflict detail', async () => {
      mockFindConflictById.mockResolvedValue(MOCK_CONFLICT as any);
      mockGetConflictDetail.mockResolvedValue(MOCK_CONFLICT);

      const res = await app.inject({
        method: 'GET',
        url: '/api/conflicts/conflict-1',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.id).toBe('conflict-1');
    });

    it('should return 404 when conflict not found', async () => {
      mockFindConflictById.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/conflicts/nonexistent',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/conflicts/:conflictId', () => {
    it('should update conflict status', async () => {
      const updated = { ...MOCK_CONFLICT, status: 'resolved' as const };
      mockFindConflictById.mockResolvedValue(MOCK_CONFLICT as any);
      mockUpdateConflictStatus.mockResolvedValue(updated);

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/conflicts/conflict-1',
        headers: { authorization: await authHeader() },
        payload: { status: 'resolved' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.status).toBe('resolved');
    });
  });

  describe('PATCH /api/projects/:projectId/conflicts/batch-resolve', () => {
    it('should batch resolve conflicts', async () => {
      mockBatchResolve.mockResolvedValue({ count: 3 });

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/projects/proj-1/conflicts/batch-resolve',
        headers: { authorization: await authHeader() },
        payload: { status: 'resolved' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.count).toBe(3);
    });
  });
});
