import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../local-session.sync.js', () => ({
  getProjectSessionFiles: vi.fn(),
  updateSyncedSession: vi.fn(),
}));

vi.mock('../../sessions/parsers/claude-code-session.parser.js', () => ({
  parseClaudeCodeSession: vi.fn(),
}));

vi.mock('../../sessions/session-import.service.js', () => ({
  importParsedSession: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { getProjectSessionFiles, updateSyncedSession } from '../local-session.sync.js';
import { parseClaudeCodeSession } from '../../sessions/parsers/claude-code-session.parser.js';
import { importParsedSession } from '../../sessions/session-import.service.js';
import { readFile } from 'node:fs/promises';
import { detectSyncTasks, executeAutoSync } from '../local-session.auto-sync.js';

const mockGetProjectSessionFiles = getProjectSessionFiles as ReturnType<typeof vi.fn>;
const mockUpdateSyncedSession = updateSyncedSession as ReturnType<typeof vi.fn>;
const mockParseClaudeCodeSession = parseClaudeCodeSession as ReturnType<typeof vi.fn>;
const mockImportParsedSession = importParsedSession as ReturnType<typeof vi.fn>;
const mockReadFile = readFile as ReturnType<typeof vi.fn>;

function makeChainableDb(returnValue: unknown = []) {
  return {
    selectFrom: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue(returnValue),
    executeTakeFirst: vi.fn().mockResolvedValue(undefined),
    insertInto: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflict: vi.fn().mockImplementation((cb: (oc: unknown) => unknown) => {
      const oc = {
        columns: vi.fn().mockReturnValue({
          doUpdateSet: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue(undefined) }),
        }),
      };
      cb(oc);
      return { execute: vi.fn().mockResolvedValue(undefined) };
    }),
    execute2: vi.fn().mockResolvedValue(undefined),
  } as any;
}

const makeSessionFile = (overrides: Record<string, unknown> = {}) => ({
  dir: '-Users-test-project',
  fileName: 'sess-1.jsonl',
  fullPath: '/home/.claude/projects/-Users-test-project/sess-1.jsonl',
  lastModifiedMs: Date.now(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('detectSyncTasks', () => {
  it('returns empty for user with no projects', async () => {
    const metaDb = makeChainableDb([]);
    const resolveDb = vi.fn();

    const tasks = await detectSyncTasks(metaDb, 'user-1', resolveDb);

    expect(tasks).toEqual([]);
    expect(resolveDb).not.toHaveBeenCalled();
  });

  it('returns NEW task for unsynced file', async () => {
    // metaDb returns one owned project
    const metaDb = {
      selectFrom: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi
        .fn()
        .mockResolvedValueOnce([{ id: 'proj-1' }]) // ownedProjects
        .mockResolvedValueOnce([]), // collabProjects
    } as any;

    const file = makeSessionFile();
    mockGetProjectSessionFiles.mockResolvedValue([file]);

    // dataDb returns no synced rows
    const dataDb = makeChainableDb([]);
    const resolveDb = vi.fn().mockResolvedValue(dataDb);

    const tasks = await detectSyncTasks(metaDb, 'user-1', resolveDb);

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      projectId: 'proj-1',
      externalSessionId: 'sess-1',
      isUpdate: false,
    });
  });

  it('returns UPDATE task when file is newer than synced_at', async () => {
    const metaDb = {
      selectFrom: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi
        .fn()
        .mockResolvedValueOnce([{ id: 'proj-1' }])
        .mockResolvedValueOnce([]),
    } as any;

    const now = Date.now();
    const file = makeSessionFile({ lastModifiedMs: now });
    mockGetProjectSessionFiles.mockResolvedValue([file]);

    const syncedRow = {
      external_session_id: 'sess-1',
      session_id: 'internal-1',
      synced_at: new Date(now - 60_000), // 1 minute before file
    };
    const dataDb = makeChainableDb([syncedRow]);
    const resolveDb = vi.fn().mockResolvedValue(dataDb);

    const tasks = await detectSyncTasks(metaDb, 'user-1', resolveDb);

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      isUpdate: true,
      internalSessionId: 'internal-1',
    });
  });

  it('skips up-to-date files', async () => {
    const metaDb = {
      selectFrom: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi
        .fn()
        .mockResolvedValueOnce([{ id: 'proj-1' }])
        .mockResolvedValueOnce([]),
    } as any;

    const now = Date.now();
    const file = makeSessionFile({ lastModifiedMs: now });
    mockGetProjectSessionFiles.mockResolvedValue([file]);

    const syncedRow = {
      external_session_id: 'sess-1',
      session_id: 'internal-1',
      synced_at: new Date(now + 1000), // synced AFTER file modification
    };
    const dataDb = makeChainableDb([syncedRow]);
    const resolveDb = vi.fn().mockResolvedValue(dataDb);

    const tasks = await detectSyncTasks(metaDb, 'user-1', resolveDb);

    expect(tasks).toHaveLength(0);
  });

  it('uses resolveDb per project for synced_sessions lookup', async () => {
    const metaDb = {
      selectFrom: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi
        .fn()
        .mockResolvedValueOnce([{ id: 'proj-1' }, { id: 'proj-2' }]) // 2 owned projects
        .mockResolvedValueOnce([]), // no collab projects
    } as any;

    mockGetProjectSessionFiles
      .mockResolvedValueOnce([makeSessionFile()])
      .mockResolvedValueOnce([makeSessionFile({ fileName: 'sess-2.jsonl' })]);

    const dataDb1 = makeChainableDb([]);
    const dataDb2 = makeChainableDb([]);
    const resolveDb = vi.fn().mockResolvedValueOnce(dataDb1).mockResolvedValueOnce(dataDb2);

    await detectSyncTasks(metaDb, 'user-1', resolveDb);

    expect(resolveDb).toHaveBeenCalledWith('proj-1');
    expect(resolveDb).toHaveBeenCalledWith('proj-2');
    expect(dataDb1.selectFrom).toHaveBeenCalledWith('synced_sessions');
    expect(dataDb2.selectFrom).toHaveBeenCalledWith('synced_sessions');
  });
});

describe('executeAutoSync', () => {
  it('creates new sessions and records sync tracking', async () => {
    const db = makeChainableDb() as any;
    const file = makeSessionFile();

    mockReadFile.mockResolvedValue('{"type":"human"}');
    mockParseClaudeCodeSession.mockReturnValue({
      parsed: { title: 'T', messages: [] },
      filePaths: [],
    });
    mockImportParsedSession.mockResolvedValue({
      session: { id: 'new-sess' },
      messageCount: 0,
      detectedConflicts: 0,
    });

    const tasks = [
      { projectId: 'proj-1', externalSessionId: 'sess-1', file, isUpdate: false },
    ] as const;

    const report = await executeAutoSync(db, 'user-1', tasks);

    expect(report.newSynced).toBe(1);
    expect(report.updated).toBe(0);
    expect(report.errors).toBe(0);
    expect(mockImportParsedSession).toHaveBeenCalled();
    expect(db.insertInto).toHaveBeenCalledWith('synced_sessions');
  });

  it('updates existing sessions via updateSyncedSession', async () => {
    const db = makeChainableDb() as any;
    const file = makeSessionFile();
    mockUpdateSyncedSession.mockResolvedValue({ messageCount: 5 });

    const tasks = [
      {
        projectId: 'proj-1',
        externalSessionId: 'sess-1',
        file,
        isUpdate: true,
        internalSessionId: 'internal-1',
      },
    ] as const;

    const report = await executeAutoSync(db, 'user-1', tasks);

    expect(report.updated).toBe(1);
    expect(report.newSynced).toBe(0);
    expect(mockUpdateSyncedSession).toHaveBeenCalledWith(db, 'internal-1', file);
  });

  it('increments errors on failure and does not throw', async () => {
    const db = makeChainableDb() as any;
    const file = makeSessionFile();

    mockReadFile.mockRejectedValue(new Error('read failed'));

    const tasks = [
      { projectId: 'proj-1', externalSessionId: 'sess-1', file, isUpdate: false },
    ] as const;

    const report = await executeAutoSync(db, 'user-1', tasks);

    expect(report.errors).toBe(1);
    expect(report.newSynced).toBe(0);
  });
});
