import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPrdDocument,
  findPrdDocumentsByProjectId,
  findPrdDocumentById,
  deletePrdDocument,
  createPrdAnalysis,
  updatePrdAnalysis,
  findLatestAnalysisByProjectId,
  findPrdAnalysisById,
} from '../prd-analysis.repository.js';

const now = new Date('2025-01-01T00:00:00.000Z');

const makePrdDocRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'doc-1',
  project_id: 'proj-1',
  user_id: 'user-1',
  title: 'Test PRD',
  content: '# PRD',
  file_name: 'test.md',
  created_at: now,
  updated_at: now,
  ...overrides,
});

function createMockDb() {
  const executeTakeFirst = vi.fn();
  const executeTakeFirstOrThrow = vi.fn();
  const execute = vi.fn().mockResolvedValue([]);

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returningAll = vi.fn().mockReturnValue(chain);
  chain.selectAll = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.offset = vi.fn().mockReturnValue(chain);
  chain.executeTakeFirst = executeTakeFirst;
  chain.executeTakeFirstOrThrow = executeTakeFirstOrThrow;
  chain.execute = execute;

  return {
    insertInto: vi.fn().mockReturnValue(chain),
    selectFrom: vi.fn().mockReturnValue(chain),
    updateTable: vi.fn().mockReturnValue(chain),
    deleteFrom: vi.fn().mockReturnValue(chain),
    fn: { countAll: vi.fn().mockReturnValue({ as: vi.fn().mockReturnValue('count_all') }) },
    _chain: chain,
    _executeTakeFirst: executeTakeFirst,
    _executeTakeFirstOrThrow: executeTakeFirstOrThrow,
    _execute: execute,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createPrdDocument', () => {
  it('should insert document and return domain object', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(makePrdDocRow());

    const result = await createPrdDocument(db, {
      projectId: 'proj-1',
      userId: 'user-1',
      title: 'Test PRD',
      content: '# PRD',
      fileName: 'test.md',
    });

    expect(result.id).toBe('doc-1');
    expect(result.projectId).toBe('proj-1');
    expect(result.title).toBe('Test PRD');
    expect(db.insertInto).toHaveBeenCalledWith('prd_documents');
  });
});

describe('findPrdDocumentsByProjectId', () => {
  it('should return documents for project', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValue([makePrdDocRow()]);

    const result = await findPrdDocumentsByProjectId(db, 'proj-1');

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('doc-1');
  });

  it('should return empty array when no documents', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValue([]);

    const result = await findPrdDocumentsByProjectId(db, 'proj-1');
    expect(result).toEqual([]);
  });
});

describe('findPrdDocumentById', () => {
  it('should return document when found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(makePrdDocRow());

    const result = await findPrdDocumentById(db, 'doc-1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('doc-1');
  });

  it('should return null when not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await findPrdDocumentById(db, 'nonexistent');
    expect(result).toBeNull();
  });
});

describe('deletePrdDocument', () => {
  it('should delete document by id', async () => {
    const db = createMockDb();
    await deletePrdDocument(db, 'doc-1');

    expect(db.deleteFrom).toHaveBeenCalledWith('prd_documents');
    expect(db._chain.where).toHaveBeenCalledWith('id', '=', 'doc-1');
  });
});

const makeAnalysisRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'analysis-1',
  prd_document_id: 'doc-1',
  project_id: 'proj-1',
  status: 'completed',
  overall_rate: 85,
  total_items: 10,
  achieved_items: 7,
  partial_items: 2,
  not_started_items: 1,
  scanned_files_count: 50,
  model_used: 'claude-3',
  input_tokens_used: 1000,
  output_tokens_used: 500,
  error_message: null,
  created_at: now,
  completed_at: now,
  ...overrides,
});

describe('createPrdAnalysis', () => {
  it('should insert analysis and return domain object', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(makeAnalysisRow());

    const result = await createPrdAnalysis(db, {
      prdDocumentId: 'doc-1',
      projectId: 'proj-1',
      modelUsed: 'claude-3',
    });

    expect(result.id).toBe('analysis-1');
    expect(db.insertInto).toHaveBeenCalledWith('prd_analyses');
  });
});

describe('updatePrdAnalysis', () => {
  it('should update specified fields', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(
      makeAnalysisRow({ status: 'completed', overall_rate: 90 }),
    );

    const result = await updatePrdAnalysis(db, 'analysis-1', {
      status: 'completed',
      overallRate: 90,
    });

    expect(db.updateTable).toHaveBeenCalledWith('prd_analyses');
    expect(result.status).toBe('completed');
  });
});

describe('findLatestAnalysisByProjectId', () => {
  it('should return null when no analysis found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await findLatestAnalysisByProjectId(db, 'proj-1');
    expect(result).toBeNull();
  });

  it('should return analysis with requirements', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue({
      ...makeAnalysisRow(),
      document_title: 'PRD Doc',
      document_file_name: 'prd.md',
    });
    db._execute.mockResolvedValue([
      {
        id: 'req-1',
        prd_analysis_id: 'analysis-1',
        requirement_text: 'Must do X',
        category: 'functional',
        status: 'achieved',
        confidence: 95,
        evidence: 'Found in code',
        file_paths: ['src/x.ts'],
        sort_order: 0,
        created_at: now,
      },
    ]);

    const result = await findLatestAnalysisByProjectId(db, 'proj-1');
    expect(result).not.toBeNull();
    expect(result!.requirements).toHaveLength(1);
    expect(result!.documentTitle).toBe('PRD Doc');
  });
});

describe('findPrdAnalysisById', () => {
  it('should return null when not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await findPrdAnalysisById(db, 'nonexistent');
    expect(result).toBeNull();
  });
});
