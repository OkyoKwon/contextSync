import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../test-helpers/create-test-app.js';
import { authHeader } from '../../../test-helpers/auth-helper.js';

vi.mock('../prd-analysis.service.js', () => ({
  uploadPrdDocument: vi.fn(),
  listPrdDocuments: vi.fn(),
  deletePrdDocument: vi.fn(),
  startAnalysis: vi.fn(),
  getLatestAnalysis: vi.fn(),
  listAnalysisHistory: vi.fn(),
  getAnalysisDetail: vi.fn(),
  deleteAnalysis: vi.fn(),
}));

vi.mock('../prd-analysis.repository.js', () => ({
  findPrdDocumentById: vi.fn(),
  findPrdAnalysisById: vi.fn(),
  createPrdDocument: vi.fn(),
  findPrdDocumentsByProjectId: vi.fn(),
  deletePrdDocument: vi.fn(),
  createAnalysis: vi.fn(),
  findAnalysesByProjectId: vi.fn(),
  findAnalysisById: vi.fn(),
  deleteAnalysis: vi.fn(),
  updateAnalysisStatus: vi.fn(),
  updateAnalysisResult: vi.fn(),
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

vi.mock('../../projects/project.service.js', () => ({
  getProject: vi.fn(),
  assertProjectAccess: vi.fn(),
  createProject: vi.fn(),
  getProjects: vi.fn(),
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
  getUserRoleInProject: vi.fn(),
}));

import * as prdService from '../prd-analysis.service.js';
import { findPrdAnalysisById } from '../prd-analysis.repository.js';

const mockListDocs = vi.mocked(prdService.listPrdDocuments);
const mockGetLatest = vi.mocked(prdService.getLatestAnalysis);
const mockGetDetail = vi.mocked(prdService.getAnalysisDetail);
const mockDeleteDoc = vi.mocked(prdService.deletePrdDocument);
const mockFindAnalysis = vi.mocked(findPrdAnalysisById);

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

describe('PRD Analysis Routes Integration', () => {
  describe('GET /api/projects/:projectId/prd/documents', () => {
    it('should return PRD documents', async () => {
      mockListDocs.mockResolvedValue([]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/prd/documents',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });

    it('should return 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/prd/documents',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/prd/documents/:documentId', () => {
    it('should delete document when found', async () => {
      const mockFindDoc = vi.mocked(
        (await import('../prd-analysis.repository.js')).findPrdDocumentById,
      );
      mockFindDoc.mockResolvedValue({ id: 'doc-1', projectId: 'proj-1' } as any);
      mockDeleteDoc.mockResolvedValue(undefined);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/prd/documents/doc-1',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/projects/:projectId/prd/analysis/latest', () => {
    it('should return latest analysis', async () => {
      mockGetLatest.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/proj-1/prd/analysis/latest',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/prd/analysis/:analysisId', () => {
    it('should return analysis detail', async () => {
      mockFindAnalysis.mockResolvedValue({ id: 'a-1', projectId: 'proj-1' } as any);
      mockGetDetail.mockResolvedValue({ id: 'a-1' } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/prd/analysis/a-1',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should return 404 when not found', async () => {
      mockFindAnalysis.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/prd/analysis/nonexistent',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
