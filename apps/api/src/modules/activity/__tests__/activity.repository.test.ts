import { describe, it, expect, vi, beforeEach } from 'vitest';
import { insertActivity, findActivitiesByProjectId } from '../activity.repository.js';

function createMockDb() {
  const execute = vi.fn().mockResolvedValue(undefined);
  const executeTakeFirst = vi.fn();
  const executeTakeFirstOrThrow = vi.fn();

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.values = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.selectAll = vi.fn().mockReturnValue(chain);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.offset = vi.fn().mockReturnValue(chain);
  chain.execute = execute;
  chain.executeTakeFirst = executeTakeFirst;
  chain.executeTakeFirstOrThrow = executeTakeFirstOrThrow;

  const db = {
    insertInto: vi.fn().mockReturnValue(chain),
    selectFrom: vi.fn().mockReturnValue(chain),
    fn: { countAll: vi.fn().mockReturnValue({ as: vi.fn().mockReturnValue('count_all') }) },
    _chain: chain,
    _execute: execute,
    _executeTakeFirst: executeTakeFirst,
    _executeTakeFirstOrThrow: executeTakeFirstOrThrow,
  } as any;

  return db;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('insertActivity', () => {
  it('should insert activity log with all fields', async () => {
    const db = createMockDb();

    await insertActivity(db, {
      projectId: 'proj-1',
      userId: 'user-1',
      action: 'session_created',
      entityType: 'session',
      entityId: 'sess-1',
      metadata: { title: 'Test' },
    });

    expect(db.insertInto).toHaveBeenCalledWith('activity_log');
    expect(db._chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'proj-1',
        user_id: 'user-1',
        action: 'session_created',
        entity_type: 'session',
        entity_id: 'sess-1',
      }),
    );
    expect(db._execute).toHaveBeenCalled();
  });

  it('should default entityId to null and metadata to empty object', async () => {
    const db = createMockDb();

    await insertActivity(db, {
      projectId: 'proj-1',
      userId: 'user-1',
      action: 'session_created',
      entityType: 'session',
    });

    expect(db._chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_id: null,
        metadata: '{}',
      }),
    );
  });
});

describe('findActivitiesByProjectId', () => {
  it('should return entries and total count', async () => {
    const db = createMockDb();
    const now = new Date('2025-01-01T00:00:00.000Z');

    const rows = [
      {
        id: 'act-1',
        project_id: 'proj-1',
        user_id: 'user-1',
        user_name: 'Test User',
        user_avatar_url: null,
        action: 'session_created',
        entity_type: 'session',
        entity_id: 'sess-1',
        metadata: '{"title":"Test"}',
        created_at: now,
      },
    ];

    // First call: rows query, second call: count query
    db._execute.mockResolvedValueOnce(rows);
    db._executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 1 });

    const result = await findActivitiesByProjectId(db, 'proj-1', 1, 20);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toEqual({
      id: 'act-1',
      projectId: 'proj-1',
      userId: 'user-1',
      userName: 'Test User',
      userAvatarUrl: null,
      action: 'session_created',
      entityType: 'session',
      entityId: 'sess-1',
      metadata: { title: 'Test' },
      createdAt: '2025-01-01T00:00:00.000Z',
    });
    expect(result.total).toBe(1);
  });

  it('should calculate correct offset for pagination', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValueOnce([]);
    db._executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 0 });

    await findActivitiesByProjectId(db, 'proj-1', 3, 10);

    // page 3, limit 10 → offset 20
    expect(db._chain.offset).toHaveBeenCalledWith(20);
    expect(db._chain.limit).toHaveBeenCalledWith(10);
  });

  it('should handle metadata as object (not string)', async () => {
    const db = createMockDb();
    const now = new Date();
    const rows = [
      {
        id: 'act-1',
        project_id: 'proj-1',
        user_id: 'user-1',
        user_name: 'User',
        user_avatar_url: 'https://avatar.url',
        action: 'session_created',
        entity_type: 'session',
        entity_id: null,
        metadata: { already: 'parsed' },
        created_at: now,
      },
    ];

    db._execute.mockResolvedValueOnce(rows);
    db._executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 1 });

    const result = await findActivitiesByProjectId(db, 'proj-1', 1, 20);

    expect(result.entries[0].metadata).toEqual({ already: 'parsed' });
    expect(result.entries[0].userAvatarUrl).toBe('https://avatar.url');
  });
});
