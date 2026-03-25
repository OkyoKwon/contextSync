import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../projects/project.service.js', () => ({
  assertProjectAccess: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

vi.mock('../../sessions/parsers/claude-code-session.parser.js', () => ({
  parseClaudeCodeSession: vi.fn(),
}));

import { assertProjectAccess } from '../../projects/project.service.js';
import { readFile } from 'node:fs/promises';
import { parseClaudeCodeSession } from '../../sessions/parsers/claude-code-session.parser.js';
import { recalculateTokenUsage } from '../local-session.sync.js';

const mockAssertProjectAccess = assertProjectAccess as ReturnType<typeof vi.fn>;
const mockReadFile = readFile as ReturnType<typeof vi.fn>;
const mockParseClaudeCodeSession = parseClaudeCodeSession as ReturnType<typeof vi.fn>;

function makeChainableDb(returnValue: unknown = []) {
  return {
    selectFrom: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue(returnValue),
    deleteFrom: vi.fn().mockReturnThis(),
    insertInto: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertProjectAccess.mockResolvedValue(undefined);
});

describe('recalculateTokenUsage', () => {
  it('asserts access on metaDb', async () => {
    const metaDb = makeChainableDb();
    const dataDb = makeChainableDb([]);

    await recalculateTokenUsage(metaDb, dataDb, 'proj-1', 'user-1');

    expect(mockAssertProjectAccess).toHaveBeenCalledWith(metaDb, 'proj-1', 'user-1');
  });

  it('reads synced_sessions from dataDb', async () => {
    const metaDb = makeChainableDb();
    const dataDb = makeChainableDb([]);

    await recalculateTokenUsage(metaDb, dataDb, 'proj-1', 'user-1');

    expect(dataDb.selectFrom).toHaveBeenCalledWith('synced_sessions');
  });

  it('writes messages to dataDb', async () => {
    const metaDb = makeChainableDb();
    const syncedRows = [
      { session_id: 's1', external_session_id: 'ext-1', source_path: '/tmp/test.jsonl' },
    ];
    const dataDb = makeChainableDb(syncedRows);

    mockReadFile.mockResolvedValue('{"type":"human","message":{"text":"hi"}}');
    mockParseClaudeCodeSession.mockReturnValue({
      parsed: {
        title: 'Test',
        messages: [{ role: 'user', content: 'hi', contentType: 'prompt' }],
      },
      filePaths: [],
    });

    await recalculateTokenUsage(metaDb, dataDb, 'proj-1', 'user-1');

    expect(dataDb.deleteFrom).toHaveBeenCalledWith('messages');
    expect(dataDb.insertInto).toHaveBeenCalledWith('messages');
  });

  it('skips ENOENT files and reports as skipped', async () => {
    const metaDb = makeChainableDb();
    const syncedRows = [
      { session_id: 's1', external_session_id: 'ext-1', source_path: '/missing.jsonl' },
    ];
    const dataDb = makeChainableDb(syncedRows);

    mockReadFile.mockRejectedValue(new Error('ENOENT: no such file'));

    const result = await recalculateTokenUsage(metaDb, dataDb, 'proj-1', 'user-1');

    expect(result.skipped).toBe(1);
    expect(result.errors).toHaveLength(0);
  });
});
