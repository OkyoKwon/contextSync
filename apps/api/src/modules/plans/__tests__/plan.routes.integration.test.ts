import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../test-helpers/create-test-app.js';
import { authHeader } from '../../../test-helpers/auth-helper.js';

vi.mock('../plan.service.js', () => ({
  listPlans: vi.fn(),
  getPlanDetail: vi.fn(),
  deletePlan: vi.fn(),
}));

import * as planService from '../plan.service.js';

const mockListPlans = vi.mocked(planService.listPlans);
const mockGetPlanDetail = vi.mocked(planService.getPlanDetail);
const mockDeletePlan = vi.mocked(planService.deletePlan);

const MOCK_PLAN = {
  filename: 'test-plan.md',
  title: 'Test Plan',
  content: '# Plan',
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

describe('Plan Routes Integration', () => {
  describe('GET /api/plans/local', () => {
    it('should return plans list', async () => {
      mockListPlans.mockResolvedValue([MOCK_PLAN]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/plans/local',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it('should return 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/plans/local',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/plans/local/:filename', () => {
    it('should return plan detail', async () => {
      mockGetPlanDetail.mockResolvedValue(MOCK_PLAN);

      const res = await app.inject({
        method: 'GET',
        url: '/api/plans/local/test-plan.md',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.filename).toBe('test-plan.md');
    });
  });

  describe('DELETE /api/plans/local/:filename', () => {
    it('should delete plan', async () => {
      mockDeletePlan.mockResolvedValue(undefined);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/plans/local/test-plan.md',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);
    });
  });
});
