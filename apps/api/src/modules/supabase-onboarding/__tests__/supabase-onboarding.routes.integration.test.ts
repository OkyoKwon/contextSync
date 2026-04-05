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

vi.mock('../../projects/project.repository.js', () => ({
  updateDatabaseMode: vi.fn(),
}));

vi.mock('../../../lib/project-sync.js', () => ({
  syncProjectToRemote: vi.fn(),
}));

import * as onboardingService from '../supabase-onboarding.service.js';
import { supabaseOnboardingRoutes } from '../supabase-onboarding.routes.js';

const mockGetProjects = vi.mocked(onboardingService.getProjectsForUser);
const mockGetOrgs = vi.mocked(onboardingService.getOrganizationsForUser);
const mockAutoSetup = vi.mocked(onboardingService.autoSetupExisting);
const mockCreateAndSetup = vi.mocked(onboardingService.createAndSetup);

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

  describe('POST /api/supabase/auto-setup', () => {
    it('should setup existing project', async () => {
      mockAutoSetup.mockResolvedValue({ requiresRestart: false, migrationsApplied: [] });

      const res = await app.inject({
        method: 'POST',
        url: '/api/supabase/auto-setup',
        headers: { authorization: await authHeader() },
        payload: {
          projectId: '00000000-0000-0000-0000-000000000001',
          supabaseProjectRef: 'ref-123',
          dbPassword: 'pass',
        },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should return 400 for invalid input', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/supabase/auto-setup',
        headers: { authorization: await authHeader() },
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/supabase/create-and-setup', () => {
    it('should create and setup project', async () => {
      mockCreateAndSetup.mockResolvedValue({ requiresRestart: false, migrationsApplied: [] });

      const res = await app.inject({
        method: 'POST',
        url: '/api/supabase/create-and-setup',
        headers: { authorization: await authHeader() },
        payload: {
          projectId: '00000000-0000-0000-0000-000000000001',
          name: 'new-db',
          organizationId: 'org-1',
          dbPassword: 'password123',
          region: 'us-east-1',
        },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should return 504 on recovery result', async () => {
      mockCreateAndSetup.mockResolvedValue({
        recovered: true,
        projectRef: 'ref-123',
        region: 'us-east-1',
        error: 'Timeout',
      } as any);

      const res = await app.inject({
        method: 'POST',
        url: '/api/supabase/create-and-setup',
        headers: { authorization: await authHeader() },
        payload: {
          projectId: '00000000-0000-0000-0000-000000000001',
          name: 'new-db',
          organizationId: 'org-1',
          dbPassword: 'password123',
          region: 'us-east-1',
        },
      });

      expect(res.statusCode).toBe(504);
    });
  });
});
