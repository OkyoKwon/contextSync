import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../test-helpers/create-test-app.js';
import { authHeader } from '../../../test-helpers/auth-helper.js';

vi.mock('../setup.service.js', () => ({
  getDatabaseStatus: vi.fn(),
  testConnection: vi.fn(),
  switchToRemote: vi.fn(),
}));

vi.mock('../../projects/project.repository.js', () => ({
  updateDatabaseMode: vi.fn(),
  createProject: vi.fn(),
  findProjectsWithTeamInfo: vi.fn(),
  findProjectByIdWithTeamInfo: vi.fn(),
  findProjectById: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  findProjectByJoinCode: vi.fn(),
  updateJoinCode: vi.fn(),
}));

vi.mock('../../../lib/project-sync.js', () => ({
  syncProjectToRemote: vi.fn(),
}));

import { getDatabaseStatus, testConnection } from '../setup.service.js';

const mockGetStatus = vi.mocked(getDatabaseStatus);
const mockTestConnection = vi.mocked(testConnection);

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

describe('Setup Routes Integration', () => {
  describe('GET /api/setup/status', () => {
    it('should return database status without auth (public endpoint)', async () => {
      mockGetStatus.mockReturnValue({
        databaseMode: 'local',
        provider: 'local',
        host: 'localhost',
        remoteUrl: null,
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/setup/status',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.databaseMode).toBe('local');
    });
  });

  describe('POST /api/setup/test-connection', () => {
    it('should test connection with auth', async () => {
      mockTestConnection.mockResolvedValue({ success: true } as any);

      const res = await app.inject({
        method: 'POST',
        url: '/api/setup/test-connection',
        headers: { authorization: await authHeader() },
        payload: { connectionUrl: 'postgresql://localhost:5432/test', sslEnabled: false },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.success).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/setup/test-connection',
        payload: { connectionUrl: 'postgresql://localhost:5432/test' },
      });

      expect(res.statusCode).toBe(401);
    });
  });
});
