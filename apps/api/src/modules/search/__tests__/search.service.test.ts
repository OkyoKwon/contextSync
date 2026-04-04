import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchInProject } from '../search.service.js';

function createMockDb() {
  const execute = vi.fn().mockResolvedValue([]);

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.selectAll = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.offset = vi.fn().mockReturnValue(chain);
  chain.execute = execute;

  const db = {
    selectFrom: vi.fn().mockReturnValue(chain),
    _chain: chain,
    _execute: execute,
  } as any;

  return db;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('searchInProject', () => {
  it('should return empty results when no matches found', async () => {
    const db = createMockDb();

    const result = await searchInProject(db, 'proj-1', 'test query');

    expect(result.results).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should search sessions when type is session', async () => {
    const db = createMockDb();
    const now = new Date('2025-01-01T00:00:00.000Z');

    db._execute.mockResolvedValueOnce([
      {
        id: 'sess-1',
        title: 'Test Session',
        created_at: now,
        highlight: '<b>Test</b> Session',
        rank: 0.5,
      },
    ]);

    const result = await searchInProject(db, 'proj-1', 'Test', 'session');

    expect(db.selectFrom).toHaveBeenCalledWith('sessions');
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      type: 'session',
      id: 'sess-1',
      sessionId: 'sess-1',
      title: 'Test Session',
      highlight: '<b>Test</b> Session',
      createdAt: '2025-01-01T00:00:00.000Z',
    });
  });

  it('should search messages when type is message', async () => {
    const db = createMockDb();
    const now = new Date('2025-01-01T00:00:00.000Z');

    db._execute.mockResolvedValueOnce([
      {
        id: 'msg-1',
        session_id: 'sess-1',
        title: 'Parent Session',
        created_at: now,
        highlight: 'found <b>keyword</b> here',
        rank: 0.8,
      },
    ]);

    const result = await searchInProject(db, 'proj-1', 'keyword', 'message');

    expect(db.selectFrom).toHaveBeenCalledWith('messages');
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      type: 'message',
      id: 'msg-1',
      sessionId: 'sess-1',
      title: 'Parent Session',
      highlight: 'found <b>keyword</b> here',
      createdAt: '2025-01-01T00:00:00.000Z',
    });
    expect(result.total).toBe(1);
  });

  it('should search both sessions and messages when type is all', async () => {
    const db = createMockDb();
    const now = new Date('2025-01-01T00:00:00.000Z');

    // First call: sessions, second call: messages
    db._execute
      .mockResolvedValueOnce([
        { id: 'sess-1', title: 'Session', created_at: now, highlight: 'Session', rank: 0.5 },
      ])
      .mockResolvedValueOnce([
        {
          id: 'msg-1',
          session_id: 'sess-1',
          title: 'Session',
          created_at: now,
          highlight: 'Message content',
          rank: 0.3,
        },
      ]);

    const result = await searchInProject(db, 'proj-1', 'test', 'all');

    expect(result.results).toHaveLength(2);
    expect(result.results[0].type).toBe('session');
    expect(result.results[1].type).toBe('message');
    expect(result.total).toBe(2);
  });

  it('should apply pagination offset correctly', async () => {
    const db = createMockDb();

    await searchInProject(db, 'proj-1', 'query', 'session', 3, 10);

    // page 3, limit 10 -> offset 20
    expect(db._chain.offset).toHaveBeenCalledWith(20);
    expect(db._chain.limit).toHaveBeenCalledWith(10);
  });

  it('should use default page=1 and limit=20', async () => {
    const db = createMockDb();

    await searchInProject(db, 'proj-1', 'query', 'session');

    expect(db._chain.offset).toHaveBeenCalledWith(0);
    expect(db._chain.limit).toHaveBeenCalledWith(20);
  });
});
