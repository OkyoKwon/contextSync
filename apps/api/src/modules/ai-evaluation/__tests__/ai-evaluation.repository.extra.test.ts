import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../ai-evaluation-detail.repository.js', () => ({
  toDimension: vi.fn(),
  toEvidence: vi.fn(),
  createDimensions: vi.fn(),
  createEvidence: vi.fn(),
  updateDimensionTranslation: vi.fn(),
  updateEvidenceTranslations: vi.fn(),
}));

import {
  findLatestEvaluationGroup,
  findEvaluationGroupHistory,
  findPendingOrAnalyzing,
  findEvaluationHistory,
  findTeamEvaluationSummary,
  findEvaluationsNeedingBackfill,
  findLatestCompletedGroupTime,
} from '../ai-evaluation.repository.js';

const now = new Date('2025-01-01T00:00:00.000Z');

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
      countAll: vi.fn().mockReturnValue({ as: vi.fn().mockReturnValue('c') }),
      count: vi.fn().mockReturnValue({
        distinct: vi.fn().mockReturnValue({ as: vi.fn().mockReturnValue('c') }),
      }),
      max: vi.fn().mockReturnValue({ as: vi.fn().mockReturnValue('m') }),
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

describe('findLatestEvaluationGroup', () => {
  it('should return null when no evaluations', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await findLatestEvaluationGroup(db, 'proj-1', 'user-1');
    expect(result).toBeNull();
  });
});

describe('findEvaluationGroupHistory', () => {
  it('should return empty entries when no groups', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValueOnce([]); // groupRows
    db._executeTakeFirstOrThrow.mockResolvedValue({ count: 0 });

    const result = await findEvaluationGroupHistory(db, 'proj-1', 'user-1', 1, 10);
    expect(result.entries).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe('findPendingOrAnalyzing', () => {
  it('should return null when no pending evaluation', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await findPendingOrAnalyzing(db, 'proj-1', 'user-1');
    expect(result).toBeNull();
  });
});

describe('findLatestCompletedGroupTime', () => {
  it('should return null when no completed evaluation', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await findLatestCompletedGroupTime(db, 'proj-1', 'user-1');
    expect(result).toBeNull();
  });

  it('should return ISO string when completed evaluation exists', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue({ completed_at: now });

    const result = await findLatestCompletedGroupTime(db, 'proj-1', 'user-1');
    expect(result).toBe('2025-01-01T00:00:00.000Z');
  });
});

describe('findEvaluationHistory', () => {
  it('should return empty when no evaluations', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValueOnce([]);
    db._executeTakeFirstOrThrow.mockResolvedValue({ count: 0 });

    const result = await findEvaluationHistory(db, 'proj-1', 'user-1', 1, 20);
    expect(result.entries).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe('findTeamEvaluationSummary', () => {
  it('should return empty array when no evaluations', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValue([]);

    const result = await findTeamEvaluationSummary(db, 'proj-1');
    expect(result).toEqual([]);
  });
});

describe('findEvaluationsNeedingBackfill', () => {
  it('should return evaluation IDs', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValue([{ id: 'eval-1' }, { id: 'eval-2' }]);

    const result = await findEvaluationsNeedingBackfill(db, 'proj-1', 10);
    expect(result).toEqual(['eval-1', 'eval-2']);
  });
});
