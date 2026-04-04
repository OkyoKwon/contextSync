import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../test-helpers/create-test-app.js';
import { authHeader } from '../../../test-helpers/auth-helper.js';

vi.mock('../ai-evaluation.service.js', () => ({
  triggerEvaluation: vi.fn(),
  getLatestEvaluationGroup: vi.fn(),
  getEvaluationGroup: vi.fn(),
  getLatestEvaluation: vi.fn(),
  getEvaluationDetail: vi.fn(),
  getEvaluationHistory: vi.fn(),
  getEvaluationGroupHistory: vi.fn(),
  getTeamSummary: vi.fn(),
  deleteEvaluationGroup: vi.fn(),
  backfillTranslations: vi.fn(),
}));

vi.mock('../learning-guide.service.js', () => ({
  getLearningGuide: vi.fn(),
  regenerateLearningGuide: vi.fn(),
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

import * as evalService from '../ai-evaluation.service.js';
import * as guideService from '../learning-guide.service.js';
import { getUserApiKey } from '../../auth/auth.service.js';

const mockGetLatestGroup = vi.mocked(evalService.getLatestEvaluationGroup);
const mockGetGroup = vi.mocked(evalService.getEvaluationGroup);
const mockGetLatest = vi.mocked(evalService.getLatestEvaluation);
const mockGetDetail = vi.mocked(evalService.getEvaluationDetail);
const mockGetHistory = vi.mocked(evalService.getEvaluationHistory);
const mockGetGroupHistory = vi.mocked(evalService.getEvaluationGroupHistory);
const mockGetTeamSummary = vi.mocked(evalService.getTeamSummary);
const mockDeleteGroup = vi.mocked(evalService.deleteEvaluationGroup);
const mockGetGuide = vi.mocked(guideService.getLearningGuide);
const mockGetApiKey = vi.mocked(getUserApiKey);

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetApiKey.mockResolvedValue(null);
});

describe('AI Evaluation Routes Integration', () => {
  describe('GET /api/projects/:projectId/ai-evaluation/latest-group', () => {
    it('should return latest evaluation group', async () => {
      mockGetLatestGroup.mockResolvedValue({ claude: null, chatgpt: null, gemini: null } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/ai-evaluation/latest-group?targetUserId=00000000-0000-0000-0000-000000000001',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/ai-evaluation/latest-group?targetUserId=00000000-0000-0000-0000-000000000001',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/projects/:projectId/ai-evaluation/group/:groupId', () => {
    it('should return evaluation group by id', async () => {
      mockGetGroup.mockResolvedValue({ claude: null, chatgpt: null, gemini: null } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/ai-evaluation/group/group-1',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/projects/:projectId/ai-evaluation/latest', () => {
    it('should return latest evaluation', async () => {
      mockGetLatest.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/ai-evaluation/latest?targetUserId=00000000-0000-0000-0000-000000000001',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/projects/:projectId/ai-evaluation/history', () => {
    it('should return evaluation history', async () => {
      mockGetHistory.mockResolvedValue({ entries: [], total: 0 });

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/ai-evaluation/history?targetUserId=00000000-0000-0000-0000-000000000001',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().meta).toBeDefined();
    });
  });

  describe('GET /api/projects/:projectId/ai-evaluation/group-history', () => {
    it('should return group history', async () => {
      mockGetGroupHistory.mockResolvedValue({ entries: [], total: 0 });

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/ai-evaluation/group-history?targetUserId=00000000-0000-0000-0000-000000000001',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/projects/:projectId/ai-evaluation/:evaluationId', () => {
    it('should return evaluation detail', async () => {
      mockGetDetail.mockResolvedValue({ id: 'eval-1' } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/ai-evaluation/eval-1',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.id).toBe('eval-1');
    });
  });

  describe('GET /api/projects/:projectId/ai-evaluation/summary', () => {
    it('should return team summary', async () => {
      mockGetTeamSummary.mockResolvedValue([]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/ai-evaluation/summary',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/projects/:projectId/ai-evaluation/group/:groupId', () => {
    it('should delete evaluation group', async () => {
      mockDeleteGroup.mockResolvedValue(undefined);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/projects/proj-1/ai-evaluation/group/group-1',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.deleted).toBe(true);
    });
  });

  describe('GET /api/projects/:projectId/ai-evaluation/group/:groupId/learning-guide', () => {
    it('should return learning guide', async () => {
      mockGetGuide.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/ai-evaluation/group/group-1/learning-guide',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/projects/:projectId/ai-evaluation/evaluate', () => {
    it('should return 400 when no API key configured', async () => {
      mockGetApiKey.mockResolvedValue(null);

      const res = await app.inject({
        method: 'POST',
        url: '/api/projects/proj-1/ai-evaluation/evaluate',
        headers: { authorization: await authHeader() },
        payload: { targetUserId: '00000000-0000-0000-0000-000000000001' },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().success).toBe(false);
    });
  });
});
