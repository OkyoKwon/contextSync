import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateUserPlanDetection, getUserPlanDetectionSource } from '../quota.repository.js';

function createMockDb() {
  const execute = vi.fn().mockResolvedValue(undefined);
  const executeTakeFirst = vi.fn();

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.set = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.execute = execute;
  chain.executeTakeFirst = executeTakeFirst;

  const db = {
    updateTable: vi.fn().mockReturnValue(chain),
    selectFrom: vi.fn().mockReturnValue(chain),
    _chain: chain,
    _execute: execute,
    _executeTakeFirst: executeTakeFirst,
  } as any;

  return db;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('updateUserPlanDetection', () => {
  it('should update plan and source for given user', async () => {
    const db = createMockDb();

    await updateUserPlanDetection(db, 'user-1', 'pro', 'cli');

    expect(db.updateTable).toHaveBeenCalledWith('users');
    expect(db._chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        claude_plan: 'pro',
        plan_detection_source: 'cli',
      }),
    );
    expect(db._chain.where).toHaveBeenCalledWith('id', '=', 'user-1');
    expect(db._execute).toHaveBeenCalled();
  });
});

describe('getUserPlanDetectionSource', () => {
  it('should return detection source when found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue({ plan_detection_source: 'cli' });

    const result = await getUserPlanDetectionSource(db, 'user-1');

    expect(result).toBe('cli');
    expect(db.selectFrom).toHaveBeenCalledWith('users');
  });

  it('should return null when user has no detection source', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue({ plan_detection_source: null });

    const result = await getUserPlanDetectionSource(db, 'user-1');

    expect(result).toBeNull();
  });

  it('should return null when user not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await getUserPlanDetectionSource(db, 'nonexistent');

    expect(result).toBeNull();
  });
});
