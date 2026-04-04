import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getModelBreakdown,
  getDailyUsage,
  getTotalMessageCount,
} from '../token-usage.repository.js';

function createMockDb() {
  const execute = vi.fn().mockResolvedValue([]);
  const executeTakeFirstOrThrow = vi.fn();

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.groupBy = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.execute = execute;
  chain.executeTakeFirstOrThrow = executeTakeFirstOrThrow;

  return {
    selectFrom: vi.fn().mockReturnValue(chain),
    _chain: chain,
    _execute: execute,
    _executeTakeFirstOrThrow: executeTakeFirstOrThrow,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getModelBreakdown', () => {
  it('should return model breakdown rows', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValue([
      { model_used: 'claude-3', total_tokens: '5000', message_count: '10' },
    ]);
    const result = await getModelBreakdown(db, 'proj-1', new Date(), new Date());
    expect(result).toHaveLength(1);
    expect(result[0].model_used).toBe('claude-3');
  });
});

describe('getDailyUsage', () => {
  it('should return daily usage rows', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValue([
      { date: '2025-01-01', model_used: 'claude-3', total_tokens: '3000' },
    ]);
    const result = await getDailyUsage(db, 'proj-1', new Date(), new Date());
    expect(result).toHaveLength(1);
  });
});

describe('getTotalMessageCount', () => {
  it('should return total and measured counts', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue({ total: '100', measured: '80' });
    const result = await getTotalMessageCount(db, 'proj-1', new Date(), new Date());
    expect(result.total).toBe(100);
    expect(result.measured).toBe(80);
  });
});
