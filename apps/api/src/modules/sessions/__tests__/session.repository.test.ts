import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSession,
  createMessages,
  findSessionById,
  findMessagesBySessionId,
  updateSession,
  deleteSession,
  findRecentSessionsByProject,
  findAllSessionsWithMessages,
} from '../session.repository.js';

const now = new Date('2025-01-01T00:00:00.000Z');

const makeSessionRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'sess-1',
  project_id: 'proj-1',
  user_id: 'user-1',
  title: 'Test Session',
  source: 'manual',
  status: 'active',
  file_paths: ['src/index.ts'],
  module_names: [],
  branch: null,
  tags: ['tag1'],
  metadata: '{}',
  created_at: now,
  updated_at: now,
  ...overrides,
});

const makeMessageRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'msg-1',
  session_id: 'sess-1',
  role: 'user',
  content: 'Hello',
  content_type: 'prompt',
  tokens_used: 100,
  model_used: 'claude-3',
  sort_order: 0,
  created_at: now,
  ...overrides,
});

function createMockDb() {
  const executeTakeFirst = vi.fn();
  const executeTakeFirstOrThrow = vi.fn();
  const execute = vi.fn();

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
  chain.leftJoin = vi.fn().mockReturnValue(chain);
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

describe('createSession', () => {
  it('should insert session and return domain object', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(makeSessionRow());

    const result = await createSession(db, {
      projectId: 'proj-1',
      userId: 'user-1',
      title: 'Test Session',
    });

    expect(db.insertInto).toHaveBeenCalledWith('sessions');
    expect(result.id).toBe('sess-1');
    expect(result.projectId).toBe('proj-1');
    expect(result.title).toBe('Test Session');
    expect(result.createdAt).toBe('2025-01-01T00:00:00.000Z');
  });

  it('should use defaults for optional fields', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(makeSessionRow());

    await createSession(db, { projectId: 'proj-1', userId: 'user-1', title: 'Test' });

    expect(db._chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'manual',
        branch: null,
      }),
    );
  });
});

describe('createMessages', () => {
  it('should return empty array for empty messages', async () => {
    const db = createMockDb();
    const result = await createMessages(db, 'sess-1', []);
    expect(result).toEqual([]);
    expect(db.insertInto).not.toHaveBeenCalled();
  });

  it('should insert messages and return domain objects', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValue([makeMessageRow()]);

    const result = await createMessages(db, 'sess-1', [
      { role: 'user', content: 'Hello', tokensUsed: 100 },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('msg-1');
    expect(result[0]!.content).toBe('Hello');
    expect(result[0]!.tokensUsed).toBe(100);
  });

  it('should use defaults for optional message fields', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValue([makeMessageRow()]);

    await createMessages(db, 'sess-1', [{ role: 'user', content: 'Hi' }]);

    expect(db._chain.values).toHaveBeenCalledWith([
      expect.objectContaining({
        content_type: 'prompt',
        tokens_used: null,
        model_used: null,
        sort_order: 0,
      }),
    ]);
  });
});

describe('findSessionById', () => {
  it('should return session when found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(
      makeSessionRow({ user_name: 'Test User', user_avatar_url: null }),
    );

    const result = await findSessionById(db, 'sess-1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('sess-1');
    expect(result!.userName).toBe('Test User');
  });

  it('should return null when not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await findSessionById(db, 'nonexistent');

    expect(result).toBeNull();
  });
});

describe('findMessagesBySessionId', () => {
  it('should return messages ordered by sort_order', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValue([
      makeMessageRow({ sort_order: 0 }),
      makeMessageRow({ id: 'msg-2', sort_order: 1, role: 'assistant' }),
    ]);

    const result = await findMessagesBySessionId(db, 'sess-1');

    expect(result).toHaveLength(2);
    expect(db._chain.orderBy).toHaveBeenCalledWith('sort_order', 'asc');
  });
});

describe('updateSession', () => {
  it('should update title and return updated session', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(makeSessionRow({ title: 'Updated' }));

    const result = await updateSession(db, 'sess-1', { title: 'Updated' });

    expect(result.title).toBe('Updated');
    expect(db.updateTable).toHaveBeenCalledWith('sessions');
  });
});

describe('deleteSession', () => {
  it('should delete session by id', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValue(undefined);

    await deleteSession(db, 'sess-1');

    expect(db.deleteFrom).toHaveBeenCalledWith('sessions');
    expect(db._chain.where).toHaveBeenCalledWith('id', '=', 'sess-1');
  });
});

describe('findRecentSessionsByProject', () => {
  it('should return sessions excluding given user within date range', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValue([makeSessionRow()]);

    const result = await findRecentSessionsByProject(db, 'proj-1', 'user-2', 7);

    expect(result).toHaveLength(1);
    expect(db._chain.where).toHaveBeenCalledWith('project_id', '=', 'proj-1');
    expect(db._chain.where).toHaveBeenCalledWith('user_id', '!=', 'user-2');
  });
});

describe('findAllSessionsWithMessages', () => {
  it('should return sessions with their messages grouped', async () => {
    const db = createMockDb();
    // First execute: sessions
    db._execute.mockResolvedValueOnce([makeSessionRow()]);
    // Second execute: messages
    db._execute.mockResolvedValueOnce([makeMessageRow()]);

    const result = await findAllSessionsWithMessages(db, 'proj-1');

    expect(result).toHaveLength(1);
    expect(result[0]!.session.id).toBe('sess-1');
    expect(result[0]!.messages).toHaveLength(1);
  });

  it('should return empty array when no sessions', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValueOnce([]);

    const result = await findAllSessionsWithMessages(db, 'proj-1');

    expect(result).toEqual([]);
  });
});
