import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../local-session.sync.js', () => ({
  getProjectSessionFiles: vi.fn(),
  getProjectDirectoryOwners: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));

vi.mock('../../sessions/parsers/claude-code-session.parser.js', () => ({
  parseClaudeCodeSession: vi.fn(),
  parseClaudeCodeSessionWithTimestamps: vi.fn(),
}));

import { getProjectSessionFiles, getProjectDirectoryOwners } from '../local-session.sync.js';
import { listLocalSessions, countLocalSessionsByDate } from '../local-session.service.js';

const mockGetProjectSessionFiles = getProjectSessionFiles as ReturnType<typeof vi.fn>;
const mockGetProjectDirectoryOwners = getProjectDirectoryOwners as ReturnType<typeof vi.fn>;

function makeChainableDb(returnValue: unknown = []) {
  const db: Record<string, unknown> = {
    selectFrom: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue(returnValue),
    fn: {
      count: vi.fn().mockReturnValue({
        as: vi.fn().mockReturnValue('count_expr'),
      }),
    },
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockImplementation((..._args: unknown[]) => db),
    onRef: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
  };
  return db as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetProjectDirectoryOwners.mockResolvedValue(new Map());
});

describe('listLocalSessions', () => {
  it('reads project files from metaDb', async () => {
    const metaDb = makeChainableDb();
    const dataDb = makeChainableDb([]);
    mockGetProjectSessionFiles.mockResolvedValue([]);

    await listLocalSessions(metaDb, dataDb, 'proj-1', false);

    expect(mockGetProjectSessionFiles).toHaveBeenCalledWith(metaDb, 'proj-1');
  });

  it('queries synced_sessions from dataDb', async () => {
    const metaDb = makeChainableDb();
    const dataDb = makeChainableDb([]);
    mockGetProjectSessionFiles.mockResolvedValue([]);

    await listLocalSessions(metaDb, dataDb, 'proj-1', false);

    expect(dataDb.selectFrom).toHaveBeenCalledWith('synced_sessions');
  });

  it('includes team sessions from dataDb when currentUserId provided', async () => {
    const metaDb = makeChainableDb();
    // dataDb for synced_sessions + team sessions query
    const dataDb = makeChainableDb([]);
    mockGetProjectSessionFiles.mockResolvedValue([]);

    await listLocalSessions(metaDb, dataDb, 'proj-1', false, 'user-1');

    // getTeamDbSessionGroups uses dataDb internally (sessions + users join)
    // We verify dataDb.selectFrom was called with 'sessions' for team lookup
    const selectFromCalls = dataDb.selectFrom.mock.calls.map((c: unknown[]) => c[0]);
    expect(selectFromCalls).toContain('synced_sessions');
    expect(selectFromCalls).toContain('sessions');
  });

  it('returns empty for project with no session files', async () => {
    const metaDb = makeChainableDb();
    const dataDb = makeChainableDb([]);
    mockGetProjectSessionFiles.mockResolvedValue([]);

    const groups = await listLocalSessions(metaDb, dataDb, 'proj-1', false);

    expect(groups).toEqual([]);
  });
});

describe('countLocalSessionsByDate', () => {
  it('uses metaDb for getProjectSessionFiles', async () => {
    const metaDb = makeChainableDb();
    mockGetProjectSessionFiles.mockResolvedValue([]);

    await countLocalSessionsByDate(metaDb, 'proj-1');

    expect(mockGetProjectSessionFiles).toHaveBeenCalledWith(metaDb, 'proj-1');
  });
});
