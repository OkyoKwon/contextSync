import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../projects/project.service.js', () => ({
  assertProjectAccess: vi.fn(),
}));

vi.mock('../prd-analysis.repository.js', () => ({
  createPrdDocument: vi.fn(),
  findPrdDocumentsByProjectId: vi.fn(),
  findPrdDocumentById: vi.fn(),
  deletePrdDocument: vi.fn(),
  createPrdAnalysis: vi.fn(),
  updatePrdAnalysis: vi.fn(),
  createPrdRequirements: vi.fn(),
  findLatestAnalysisByProjectId: vi.fn(),
  findAnalysisHistory: vi.fn(),
  findPrdAnalysisById: vi.fn(),
  deleteAnalysis: vi.fn(),
}));

vi.mock('../codebase-scanner.js', () => ({
  scanCodebase: vi.fn(),
}));

vi.mock('../claude-client.js', () => ({
  analyzePrd: vi.fn(),
}));

import { assertProjectAccess } from '../../projects/project.service.js';
import * as prdRepo from '../prd-analysis.repository.js';
import { scanCodebase } from '../codebase-scanner.js';
import { analyzePrd } from '../claude-client.js';
import {
  startAnalysis,
  getLatestAnalysis,
  getAnalysisHistory,
  getAnalysisDetail,
} from '../prd-analysis.service.js';
import { NotFoundError, ForbiddenError } from '../../../plugins/error-handler.plugin.js';

const mockAssertAccess = vi.mocked(assertProjectAccess);
const mockFindDocById = vi.mocked(prdRepo.findPrdDocumentById);
const mockCreateAnalysis = vi.mocked(prdRepo.createPrdAnalysis);
const mockUpdateAnalysis = vi.mocked(prdRepo.updatePrdAnalysis);
const mockCreateReqs = vi.mocked(prdRepo.createPrdRequirements);
const mockScanCodebase = vi.mocked(scanCodebase);
const mockAnalyzePrd = vi.mocked(analyzePrd);
const mockFindLatest = vi.mocked(prdRepo.findLatestAnalysisByProjectId);
const mockFindHistory = vi.mocked(prdRepo.findAnalysisHistory);
const mockFindAnalysisById = vi.mocked(prdRepo.findPrdAnalysisById);

const db = {} as any;

const MOCK_DOC = {
  id: 'doc-1',
  projectId: 'proj-1',
  userId: 'user-1',
  title: 'PRD',
  content: '# Requirements',
  fileName: 'prd.md',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const MOCK_ANALYSIS = {
  id: 'analysis-1',
  prdDocumentId: 'doc-1',
  projectId: 'proj-1',
  status: 'pending' as const,
  overallRate: null,
  totalItems: 0,
  achievedItems: 0,
  partialItems: 0,
  notStartedItems: 0,
  scannedFilesCount: 0,
  modelUsed: 'claude-3',
  inputTokensUsed: 0,
  outputTokensUsed: 0,
  errorMessage: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  completedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertAccess.mockResolvedValue(undefined as any);
});

describe('startAnalysis', () => {
  it('should throw ForbiddenError when no localDirectory', async () => {
    await expect(
      startAnalysis(db, 'key', 'model', 'proj-1', 'user-1', 'doc-1', null),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw NotFoundError when document not found', async () => {
    mockFindDocById.mockResolvedValue(null);
    await expect(
      startAnalysis(db, 'key', 'model', 'proj-1', 'user-1', 'doc-1', '/dir'),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when doc belongs to different project', async () => {
    mockFindDocById.mockResolvedValue({ ...MOCK_DOC, projectId: 'other-proj' });
    await expect(
      startAnalysis(db, 'key', 'model', 'proj-1', 'user-1', 'doc-1', '/dir'),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should complete analysis pipeline', async () => {
    mockFindDocById.mockResolvedValue(MOCK_DOC);
    mockCreateAnalysis.mockResolvedValue(MOCK_ANALYSIS);
    mockUpdateAnalysis.mockResolvedValue(MOCK_ANALYSIS);
    mockScanCodebase.mockResolvedValue({ totalFiles: 50, summary: 'code' } as any);
    mockAnalyzePrd.mockResolvedValue({
      requirements: [
        {
          requirementText: 'Req 1',
          category: 'Feature',
          status: 'achieved',
          confidence: 90,
          evidence: 'Found',
          filePaths: ['src/a.ts'],
        },
        {
          requirementText: 'Req 2',
          category: 'API',
          status: 'partial',
          confidence: 70,
          evidence: 'Half',
          filePaths: [],
        },
      ],
      overallRate: 75,
      inputTokens: 1000,
      outputTokens: 500,
      modelUsed: 'claude-3',
    });
    mockCreateReqs.mockResolvedValue([
      { id: 'r1', status: 'achieved' } as any,
      { id: 'r2', status: 'partial' } as any,
    ]);
    mockUpdateAnalysis.mockResolvedValue({
      ...MOCK_ANALYSIS,
      status: 'completed',
      overallRate: 75,
    });

    const result = await startAnalysis(db, 'key', 'model', 'proj-1', 'user-1', 'doc-1', '/dir');
    expect(mockScanCodebase).toHaveBeenCalledWith('/dir');
    expect(mockAnalyzePrd).toHaveBeenCalled();
    expect(result.status).toBe('completed');
  });

  it('should handle analysis failure and set status to failed', async () => {
    mockFindDocById.mockResolvedValue(MOCK_DOC);
    mockCreateAnalysis.mockResolvedValue(MOCK_ANALYSIS);
    mockUpdateAnalysis.mockResolvedValue(MOCK_ANALYSIS);
    mockScanCodebase.mockRejectedValue(new Error('Scan failed'));
    mockUpdateAnalysis.mockResolvedValue({ ...MOCK_ANALYSIS, status: 'failed' });

    await expect(
      startAnalysis(db, 'key', 'model', 'proj-1', 'user-1', 'doc-1', '/dir'),
    ).rejects.toThrow();
  });
});

describe('getLatestAnalysis', () => {
  it('should return latest analysis', async () => {
    mockFindLatest.mockResolvedValue(null);
    const result = await getLatestAnalysis(db, 'proj-1', 'user-1');
    expect(result).toBeNull();
  });
});

describe('getAnalysisHistory', () => {
  it('should return analysis history', async () => {
    mockFindHistory.mockResolvedValue({ entries: [], total: 0 });
    const result = await getAnalysisHistory(db, 'proj-1', 'user-1', 1, 20);
    expect(result.total).toBe(0);
  });
});

describe('getAnalysisDetail', () => {
  it('should throw NotFoundError when not found', async () => {
    mockFindAnalysisById.mockResolvedValue(null);
    await expect(getAnalysisDetail(db, 'a-1', 'user-1')).rejects.toThrow(NotFoundError);
  });

  it('should return analysis when found', async () => {
    const analysis = {
      ...MOCK_ANALYSIS,
      projectId: 'proj-1',
      requirements: [],
      documentTitle: 'T',
      documentFileName: 'f',
    };
    mockFindAnalysisById.mockResolvedValue(analysis as any);
    const result = await getAnalysisDetail(db, 'a-1', 'user-1');
    expect(result.id).toBe('analysis-1');
  });
});
