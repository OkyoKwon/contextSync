import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../projects/project.service.js', () => ({
  assertProjectAccess: vi.fn(),
}));

vi.mock('../prd-analysis.repository.js', () => ({
  createPrdDocument: vi.fn(),
  findPrdDocumentsByProjectId: vi.fn(),
  findPrdDocumentById: vi.fn(),
  deletePrdDocument: vi.fn(),
  createAnalysis: vi.fn(),
  findAnalysesByProjectId: vi.fn(),
  findAnalysisById: vi.fn(),
  deleteAnalysis: vi.fn(),
  updateAnalysisStatus: vi.fn(),
  updateAnalysisResult: vi.fn(),
}));

vi.mock('../codebase-scanner.js', () => ({
  scanCodebase: vi.fn(),
}));

vi.mock('../claude-client.js', () => ({
  analyzePrd: vi.fn(),
}));

import { assertProjectAccess } from '../../projects/project.service.js';
import * as prdRepo from '../prd-analysis.repository.js';
import { uploadPrdDocument, listPrdDocuments, deletePrdDocument } from '../prd-analysis.service.js';
import { NotFoundError, ForbiddenError } from '../../../plugins/error-handler.plugin.js';

const mockAssertAccess = vi.mocked(assertProjectAccess);
const mockCreateDoc = vi.mocked(prdRepo.createPrdDocument);
const mockFindDocs = vi.mocked(prdRepo.findPrdDocumentsByProjectId);
const mockFindDocById = vi.mocked(prdRepo.findPrdDocumentById);
const mockDeleteDoc = vi.mocked(prdRepo.deletePrdDocument);

const db = {} as any;

const MOCK_DOC = {
  id: 'doc-1',
  projectId: 'proj-1',
  userId: 'user-1',
  title: 'Test PRD',
  content: '# PRD Content',
  fileName: 'test.md',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertAccess.mockResolvedValue(undefined as any);
});

describe('uploadPrdDocument', () => {
  it('should create document with valid markdown file', async () => {
    mockCreateDoc.mockResolvedValue(MOCK_DOC);

    const result = await uploadPrdDocument(db, 'proj-1', 'user-1', 'test.md', '# Content');

    expect(result).toEqual(MOCK_DOC);
    expect(mockAssertAccess).toHaveBeenCalledWith(db, 'proj-1', 'user-1');
  });

  it('should create document with .txt extension', async () => {
    mockCreateDoc.mockResolvedValue(MOCK_DOC);

    await uploadPrdDocument(db, 'proj-1', 'user-1', 'test.txt', 'content');

    expect(mockCreateDoc).toHaveBeenCalled();
  });

  it('should throw ForbiddenError for unsupported extension', async () => {
    await expect(uploadPrdDocument(db, 'proj-1', 'user-1', 'test.exe', 'content')).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('should use filename without extension as title when no title provided', async () => {
    mockCreateDoc.mockResolvedValue(MOCK_DOC);

    await uploadPrdDocument(db, 'proj-1', 'user-1', 'my-prd.md', '# Content');

    expect(mockCreateDoc).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        title: 'my-prd',
      }),
    );
  });

  it('should use provided title when given', async () => {
    mockCreateDoc.mockResolvedValue(MOCK_DOC);

    await uploadPrdDocument(db, 'proj-1', 'user-1', 'test.md', '# Content', 'Custom Title');

    expect(mockCreateDoc).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        title: 'Custom Title',
      }),
    );
  });
});

describe('listPrdDocuments', () => {
  it('should return documents after access check', async () => {
    mockFindDocs.mockResolvedValue([MOCK_DOC]);

    const result = await listPrdDocuments(db, 'proj-1', 'user-1');

    expect(result).toEqual([MOCK_DOC]);
    expect(mockAssertAccess).toHaveBeenCalledWith(db, 'proj-1', 'user-1');
  });

  it('should return empty array when no documents', async () => {
    mockFindDocs.mockResolvedValue([]);

    const result = await listPrdDocuments(db, 'proj-1', 'user-1');

    expect(result).toEqual([]);
  });
});

describe('deletePrdDocument', () => {
  it('should delete document after access check', async () => {
    mockFindDocById.mockResolvedValue(MOCK_DOC);
    mockDeleteDoc.mockResolvedValue(undefined);

    await deletePrdDocument(db, 'doc-1', 'user-1');

    expect(mockDeleteDoc).toHaveBeenCalledWith(db, 'doc-1');
  });

  it('should throw NotFoundError when document not found', async () => {
    mockFindDocById.mockResolvedValue(null);

    await expect(deletePrdDocument(db, 'nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
  });
});
