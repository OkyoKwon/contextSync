import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { registerCors } from '../../../plugins/cors.plugin.js';
import { registerErrorHandler } from '../../../plugins/error-handler.plugin.js';
import { registerJwt } from '../../../plugins/auth.plugin.js';
import { TEST_JWT_SECRET, TEST_ENV } from '../../../test-helpers/create-test-app.js';
import { authHeader } from '../../../test-helpers/auth-helper.js';

vi.mock('../supabase-onboarding.service.js', () => ({
  getProjectsForUser: vi.fn(),
  getOrganizationsForUser: vi.fn(),
  autoSetupExisting: vi.fn(),
  createAndSetup: vi.fn(),
  listProjects: vi.fn(),
  listOrganizations: vi.fn(),
  buildConnectionUrl: vi.fn(),
  resolveConnectionErrorMessage: vi.fn(),
  resolveSupabaseErrorMessage: vi.fn(),
}));

vi.mock('../../auth/auth.service.js', () => ({
  getSupabaseToken: vi.fn(),
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

import * as onboardingService from '../supabase-onboarding.service.js';
import { supabaseOnboardingRoutes } from '../supabase-onboarding.routes.js';

const mockGetProjects = vi.mocked(onboardingService.getProjectsForUser);
const mockGetOrgs = vi.mocked(onboardingService.getOrganizationsForUser);

let app: FastifyInstance;

beforeAll(async () => {
  app = Fastify({ logger: false });
  app.decorate('db', {} as never);
  app.decorate('localDb', {} as never);
  app.decorate('remoteDb', null);
  app.decorate('resolveDb', async () => ({}) as never);
  app.decorate('invalidateDbModeCache', () => {});
  app.decorate('env', TEST_ENV);
  app.decorate('lastAuthUserId', null as string | null);

  await registerCors(app, TEST_ENV.FRONTEND_URL);
  registerErrorHandler(app);
  await registerJwt(app, TEST_JWT_SECRET);
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  app.addHook('onRequest', async (request) => {
    try {
      await request.jwtVerify();
    } catch {
      /* skip */
    }
  });

  await app.register(supabaseOnboardingRoutes, { prefix: '/api' });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Supabase Onboarding Routes Integration', () => {
  describe('GET /api/supabase/projects', () => {
    it('should return projects', async () => {
      mockGetProjects.mockResolvedValue([
        {
          ref: 'proj-ref',
          name: 'My Project',
          region: 'us-east-1',
          status: 'ACTIVE_HEALTHY',
          createdAt: '2025-01-01',
        },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/supabase/projects',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toHaveLength(1);
    });

    it('should return 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/supabase/projects',
      });
      expect(res.statusCode).toBe(401);
    });

    it('should return empty array on error', async () => {
      mockGetProjects.mockRejectedValue(new Error('No token'));

      const res = await app.inject({
        method: 'GET',
        url: '/api/supabase/projects',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });
  });

  describe('GET /api/supabase/organizations', () => {
    it('should return organizations', async () => {
      mockGetOrgs.mockResolvedValue([{ id: 'org-1', name: 'My Org' }]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/supabase/organizations',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toHaveLength(1);
    });
  });
});
