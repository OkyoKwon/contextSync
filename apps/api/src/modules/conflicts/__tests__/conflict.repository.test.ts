import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createConflict,
  findConflictsByProjectId,
  findConflictById,
  updateConflictStatus,
  existsConflictBetweenSessions,
  assignReviewer,
  updateReviewNotes,
  updateAiAnalysis,
  batchUpdateConflictStatus,
} from '../conflict.repository.js';
import type { DetectedConflict } from '@context-sync/shared';
import type { ConflictAnalysisResult } from '../conflict-ai-analyzer.js';

function createMockDb() {
  const execute = vi.fn().mockResolvedValue([]);
  const executeTakeFirst = vi.fn();
  const executeTakeFirstOrThrow = vi.fn();

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.values = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.selectAll = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.offset = vi.fn().mockReturnValue(chain);
  chain.returningAll = vi.fn().mockReturnValue(chain);
  chain.execute = execute;
  chain.executeTakeFirst = executeTakeFirst;
  chain.executeTakeFirstOrThrow = executeTakeFirstOrThrow;

  const db = {
    insertInto: vi.fn().mockReturnValue(chain),
    selectFrom: vi.fn().mockReturnValue(chain),
    updateTable: vi.fn().mockReturnValue(chain),
    fn: { countAll: vi.fn().mockReturnValue({ as: vi.fn().mockReturnValue('count_all') }) },
    _chain: chain,
    _execute: execute,
    _executeTakeFirst: executeTakeFirst,
    _executeTakeFirstOrThrow: executeTakeFirstOrThrow,
  } as any;

  return db;
}

const NOW = new Date('2025-06-01T00:00:00.000Z');

function makeConflictRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'conflict-1',
    project_id: 'proj-1',
    session_a_id: 'sess-a',
    session_b_id: 'sess-b',
    conflict_type: 'file',
    severity: 'warning',
    status: 'detected',
    description: 'Overlapping files',
    overlapping_paths: ['src/index.ts'],
    diff_data: '{}',
    resolved_by: null,
    resolved_at: null,
    created_at: NOW,
    reviewer_id: null,
    review_notes: null,
    assigned_at: null,
    ai_verdict: null,
    ai_confidence: null,
    ai_overlap_type: null,
    ai_summary: null,
    ai_risk_areas: null,
    ai_recommendation: null,
    ai_recommendation_detail: null,
    ai_analyzed_at: null,
    ai_model_used: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createConflict', () => {
  it('should insert a conflict and return mapped result', async () => {
    const db = createMockDb();
    const row = makeConflictRow();
    db._executeTakeFirstOrThrow.mockResolvedValue(row);

    const detected: DetectedConflict = {
      sessionAId: 'sess-a',
      sessionBId: 'sess-b',
      conflictType: 'file' as const,
      severity: 'warning',
      description: 'Overlapping files',
      overlappingPaths: ['src/index.ts'],
    };

    const result = await createConflict(db, 'proj-1', detected);

    expect(db.insertInto).toHaveBeenCalledWith('conflicts');
    expect(db._chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'proj-1',
        session_a_id: 'sess-a',
        session_b_id: 'sess-b',
        conflict_type: 'file',
        severity: 'warning',
        description: 'Overlapping files',
        overlapping_paths: ['src/index.ts'],
      }),
    );
    expect(result.id).toBe('conflict-1');
    expect(result.projectId).toBe('proj-1');
    expect(result.conflictType).toBe('file');
  });

  it('should set diff_data to empty JSON and resolved fields to null', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(makeConflictRow());

    const detected: DetectedConflict = {
      sessionAId: 'sess-a',
      sessionBId: 'sess-b',
      conflictType: 'file' as const,
      severity: 'info',
      description: 'test',
      overlappingPaths: [],
    };

    await createConflict(db, 'proj-1', detected);

    expect(db._chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        diff_data: JSON.stringify({}),
        resolved_by: null,
        resolved_at: null,
      }),
    );
  });
});

describe('findConflictsByProjectId', () => {
  it('should return conflicts and total count with default pagination', async () => {
    const db = createMockDb();
    const rows = [makeConflictRow()];
    db._chain.execute.mockResolvedValueOnce(rows);
    db._executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 1 });

    const result = await findConflictsByProjectId(db, 'proj-1');

    expect(db.selectFrom).toHaveBeenCalledWith('conflicts');
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]!.id).toBe('conflict-1');
    expect(result.total).toBe(1);
  });

  it('should apply pagination offset correctly', async () => {
    const db = createMockDb();
    db._chain.execute.mockResolvedValueOnce([]);
    db._executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 0 });

    await findConflictsByProjectId(db, 'proj-1', { page: 3, limit: 10 });

    // page 3, limit 10 -> offset 20
    expect(db._chain.offset).toHaveBeenCalledWith(20);
    expect(db._chain.limit).toHaveBeenCalledWith(10);
  });

  it('should apply severity filter when provided', async () => {
    const db = createMockDb();
    db._chain.execute.mockResolvedValueOnce([]);
    db._executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 0 });

    await findConflictsByProjectId(db, 'proj-1', { severity: 'critical' });

    expect(db._chain.where).toHaveBeenCalledWith('conflicts.severity', '=', 'critical');
  });

  it('should apply status filter when provided', async () => {
    const db = createMockDb();
    db._chain.execute.mockResolvedValueOnce([]);
    db._executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 0 });

    await findConflictsByProjectId(db, 'proj-1', { status: 'reviewing' });

    expect(db._chain.where).toHaveBeenCalledWith('conflicts.status', '=', 'reviewing');
  });

  it('should apply since filter as Date when provided', async () => {
    const db = createMockDb();
    db._chain.execute.mockResolvedValueOnce([]);
    db._executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 0 });

    const since = '2025-01-01T00:00:00.000Z';
    await findConflictsByProjectId(db, 'proj-1', { since });

    expect(db._chain.where).toHaveBeenCalledWith('conflicts.created_at', '>=', new Date(since));
  });

  it('should use default page=1 and limit=20 when filter is empty', async () => {
    const db = createMockDb();
    db._chain.execute.mockResolvedValueOnce([]);
    db._executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 0 });

    await findConflictsByProjectId(db, 'proj-1', {});

    expect(db._chain.offset).toHaveBeenCalledWith(0);
    expect(db._chain.limit).toHaveBeenCalledWith(20);
  });
});

describe('findConflictById', () => {
  it('should return mapped conflict when found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(makeConflictRow());

    const result = await findConflictById(db, 'conflict-1');

    expect(db.selectFrom).toHaveBeenCalledWith('conflicts');
    expect(db._chain.where).toHaveBeenCalledWith('id', '=', 'conflict-1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('conflict-1');
  });

  it('should return null when not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await findConflictById(db, 'nonexistent');

    expect(result).toBeNull();
  });
});

describe('updateConflictStatus', () => {
  it('should update status without resolved fields for non-resolved status', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(makeConflictRow({ status: 'reviewing' }));

    const result = await updateConflictStatus(db, 'conflict-1', 'reviewing');

    expect(db.updateTable).toHaveBeenCalledWith('conflicts');
    expect(db._chain.set).toHaveBeenCalledWith({ status: 'reviewing' });
    expect(result.status).toBe('reviewing');
  });

  it('should set resolved_by and resolved_at when status is resolved', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(
      makeConflictRow({ status: 'resolved', resolved_by: 'user-1', resolved_at: NOW }),
    );

    await updateConflictStatus(db, 'conflict-1', 'resolved', 'user-1');

    expect(db._chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'resolved',
        resolved_by: 'user-1',
      }),
    );
  });

  it('should set resolved_by and resolved_at when status is dismissed', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(
      makeConflictRow({ status: 'dismissed', resolved_by: null, resolved_at: NOW }),
    );

    await updateConflictStatus(db, 'conflict-1', 'dismissed');

    expect(db._chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'dismissed',
        resolved_by: null,
      }),
    );
  });
});

describe('existsConflictBetweenSessions', () => {
  it('should return true when a conflict exists', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue({ id: 'conflict-1' });

    const result = await existsConflictBetweenSessions(db, 'sess-a', 'sess-b');

    expect(result).toBe(true);
  });

  it('should return false when no conflict exists', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await existsConflictBetweenSessions(db, 'sess-a', 'sess-b');

    expect(result).toBe(false);
  });
});

describe('assignReviewer', () => {
  it('should update reviewer_id and assigned_at', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(
      makeConflictRow({ reviewer_id: 'reviewer-1', assigned_at: NOW }),
    );

    const result = await assignReviewer(db, 'conflict-1', 'reviewer-1');

    expect(db.updateTable).toHaveBeenCalledWith('conflicts');
    expect(db._chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ reviewer_id: 'reviewer-1' }),
    );
    expect(result.reviewerId).toBe('reviewer-1');
    expect(result.assignedAt).not.toBeNull();
  });
});

describe('updateReviewNotes', () => {
  it('should update review_notes field', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(makeConflictRow({ review_notes: 'Some notes' }));

    const result = await updateReviewNotes(db, 'conflict-1', 'Some notes');

    expect(db.updateTable).toHaveBeenCalledWith('conflicts');
    expect(db._chain.set).toHaveBeenCalledWith({ review_notes: 'Some notes' });
    expect(result.reviewNotes).toBe('Some notes');
  });
});

describe('updateAiAnalysis', () => {
  it('should update all AI analysis fields', async () => {
    const db = createMockDb();
    const analysis: ConflictAnalysisResult = {
      verdict: 'real_conflict' as const,
      confidence: 0.95,
      overlapType: 'same_function' as const,
      summary: 'Direct conflict found',
      riskAreas: ['src/index.ts'],
      recommendation: 'merge_carefully' as const,
      recommendationDetail: 'Merge changes carefully',
      modelUsed: 'claude-sonnet-4-20250514',
      inputTokens: 100,
      outputTokens: 200,
    };

    db._executeTakeFirstOrThrow.mockResolvedValue(
      makeConflictRow({
        ai_verdict: 'real_conflict',
        ai_confidence: 0.95,
        ai_overlap_type: 'same_function',
        ai_summary: 'Direct conflict found',
        ai_risk_areas: ['src/index.ts'],
        ai_recommendation: 'merge_carefully',
        ai_recommendation_detail: 'Merge changes carefully',
        ai_analyzed_at: NOW,
        ai_model_used: 'claude-sonnet-4-20250514',
      }),
    );

    const result = await updateAiAnalysis(db, 'conflict-1', analysis);

    expect(db.updateTable).toHaveBeenCalledWith('conflicts');
    expect(db._chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        ai_verdict: 'real_conflict',
        ai_confidence: 0.95,
        ai_overlap_type: 'same_function',
        ai_summary: 'Direct conflict found',
        ai_risk_areas: ['src/index.ts'],
        ai_recommendation: 'merge_carefully',
        ai_recommendation_detail: 'Merge changes carefully',
        ai_model_used: 'claude-sonnet-4-20250514',
        ai_input_tokens: 100,
        ai_output_tokens: 200,
      }),
    );
    expect(result.aiVerdict).toBe('real_conflict');
    expect(result.aiConfidence).toBe(0.95);
  });
});

describe('batchUpdateConflictStatus', () => {
  it('should return count of updated rows', async () => {
    const db = createMockDb();
    db._chain.execute.mockResolvedValue([makeConflictRow(), makeConflictRow({ id: 'conflict-2' })]);

    const result = await batchUpdateConflictStatus(
      db,
      'proj-1',
      ['detected', 'reviewing'],
      'resolved',
      'user-1',
    );

    expect(db.updateTable).toHaveBeenCalledWith('conflicts');
    expect(db._chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'resolved',
        resolved_by: 'user-1',
      }),
    );
    expect(result).toBe(2);
  });

  it('should return 0 when no rows match', async () => {
    const db = createMockDb();
    db._chain.execute.mockResolvedValue([]);

    const result = await batchUpdateConflictStatus(
      db,
      'proj-1',
      ['detected'],
      'resolved',
      'user-1',
    );

    expect(result).toBe(0);
  });
});
