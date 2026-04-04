import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must mock the detail repository since ai-evaluation.repository.ts re-exports from it
vi.mock('../ai-evaluation-detail.repository.js', () => ({
  toDimension: vi.fn(),
  toEvidence: vi.fn(),
  createDimensions: vi.fn(),
  createEvidence: vi.fn(),
  updateDimensionTranslation: vi.fn(),
  updateEvidenceTranslations: vi.fn(),
}));

import {
  createEvaluation,
  updateEvaluation,
  findPendingOrAnalyzingGroup,
  findUserMessagesForEvaluation,
  deleteEvaluationGroup,
  failStuckEvaluations,
} from '../ai-evaluation.repository.js';

const now = new Date('2025-01-01T00:00:00.000Z');

const makeEvalRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'eval-1',
  project_id: 'proj-1',
  target_user_id: 'user-1',
  triggered_by_user_id: 'user-2',
  perspective: 'claude',
  evaluation_group_id: 'group-1',
  status: 'pending',
  overall_score: null,
  prompt_quality_score: null,
  task_complexity_score: null,
  iteration_pattern_score: null,
  context_utilization_score: null,
  ai_capability_leverage_score: null,
  proficiency_tier: null,
  sessions_analyzed: 0,
  messages_analyzed: 0,
  model_used: 'claude-3',
  input_tokens_used: 0,
  output_tokens_used: 0,
  error_message: null,
  improvement_summary: null,
  improvement_summary_ko: null,
  date_range_start: now,
  date_range_end: now,
  created_at: now,
  completed_at: null,
  ...overrides,
});

function createMockDb() {
  const executeTakeFirst = vi.fn();
  const executeTakeFirstOrThrow = vi.fn();
  const execute = vi.fn().mockResolvedValue([]);

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returningAll = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockReturnValue(chain);
  chain.selectAll = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.offset = vi.fn().mockReturnValue(chain);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.leftJoin = vi.fn().mockReturnValue(chain);
  chain.groupBy = vi.fn().mockReturnValue(chain);
  chain.executeTakeFirst = executeTakeFirst;
  chain.executeTakeFirstOrThrow = executeTakeFirstOrThrow;
  chain.execute = execute;

  return {
    insertInto: vi.fn().mockReturnValue(chain),
    selectFrom: vi.fn().mockReturnValue(chain),
    updateTable: vi.fn().mockReturnValue(chain),
    deleteFrom: vi.fn().mockReturnValue(chain),
    fn: {
      countAll: vi.fn().mockReturnValue({ as: vi.fn().mockReturnValue('count_all') }),
      count: vi
        .fn()
        .mockReturnValue({
          distinct: vi.fn().mockReturnValue({ as: vi.fn().mockReturnValue('count_distinct') }),
        }),
    },
    _chain: chain,
    _executeTakeFirst: executeTakeFirst,
    _executeTakeFirstOrThrow: executeTakeFirstOrThrow,
    _execute: execute,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createEvaluation', () => {
  it('should insert evaluation and return domain object', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(makeEvalRow());

    const result = await createEvaluation(db, {
      projectId: 'proj-1',
      targetUserId: 'user-1',
      triggeredByUserId: 'user-2',
      dateRangeStart: now,
      dateRangeEnd: now,
      modelUsed: 'claude-3',
      perspective: 'claude',
      evaluationGroupId: 'group-1',
    });

    expect(result.id).toBe('eval-1');
    expect(result.perspective).toBe('claude');
    expect(db.insertInto).toHaveBeenCalledWith('ai_evaluations');
  });
});

describe('updateEvaluation', () => {
  it('should update specified fields', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(
      makeEvalRow({ status: 'completed', overall_score: 85 }),
    );

    const result = await updateEvaluation(db, 'eval-1', {
      status: 'completed',
      overallScore: 85,
    });

    expect(db.updateTable).toHaveBeenCalledWith('ai_evaluations');
    expect(result.status).toBe('completed');
  });
});

describe('findPendingOrAnalyzingGroup', () => {
  it('should return true when pending evaluation exists', async () => {
    const db = createMockDb();
    // failStuckEvaluations call (update then select)
    db._execute.mockResolvedValueOnce(undefined);
    // findPending select
    db._executeTakeFirst.mockResolvedValue({ id: 'eval-1' });

    const result = await findPendingOrAnalyzingGroup(db, 'proj-1', 'user-1');
    expect(result).toBe(true);
  });

  it('should return false when no pending group', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValueOnce(undefined);
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await findPendingOrAnalyzingGroup(db, 'proj-1', 'user-1');
    expect(result).toBe(false);
  });
});

describe('findUserMessagesForEvaluation', () => {
  it('should return empty when no sessions found', async () => {
    const db = createMockDb();
    // sessions query
    db._execute.mockResolvedValueOnce([]);

    const result = await findUserMessagesForEvaluation(db, 'proj-1', 'user-1', now, now, 10);

    expect(result.messages).toHaveLength(0);
    expect(result.sessionCount).toBe(0);
  });
});

describe('deleteEvaluationGroup', () => {
  it('should delete evaluations by group id', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue({ numDeletedRows: BigInt(3) });

    const result = await deleteEvaluationGroup(db, 'group-1');
    expect(db.deleteFrom).toHaveBeenCalledWith('ai_evaluations');
    expect(result).toBe(3);
  });
});

describe('failStuckEvaluations', () => {
  it('should update stuck evaluations to failed', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValue(undefined);

    await failStuckEvaluations(db, 'proj-1', 'user-1');

    expect(db.updateTable).toHaveBeenCalledWith('ai_evaluations');
  });
});
