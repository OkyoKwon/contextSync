import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile, readdir, stat } from 'node:fs/promises';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));

vi.mock('../../sessions/parsers/claude-code-session.parser.js', () => ({
  parseClaudeCodeSession: vi.fn().mockReturnValue({
    parsed: { title: 'Test', messages: [], source: 'claude_code' },
    filePaths: [],
  }),
  parseClaudeCodeSessionWithTimestamps: vi.fn().mockReturnValue({
    title: 'Test',
    messages: [],
  }),
}));

vi.mock('../../sessions/parsers/desktop-audit-session.parser.js', () => ({
  parseDesktopAuditSession: vi.fn(),
  parseDesktopAuditSessionWithTimestamps: vi.fn(),
}));

vi.mock('../desktop-session.discovery.js', () => ({
  findDesktopSessionFiles: vi.fn().mockResolvedValue([]),
}));

import { getProjectSessionFiles, getProjectDirectoryOwners } from '../local-session.sync.js';

const mockReaddir = vi.mocked(readdir);
const mockStat = vi.mocked(stat);

function createMockDb() {
  const executeTakeFirst = vi.fn();
  const execute = vi.fn().mockResolvedValue([]);

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.selectAll = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.leftJoin = vi.fn().mockReturnValue(chain);
  chain.executeTakeFirst = executeTakeFirst;
  chain.execute = execute;

  return {
    selectFrom: vi.fn().mockReturnValue(chain),
    _chain: chain,
    _executeTakeFirst: executeTakeFirst,
    _execute: execute,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getProjectSessionFiles', () => {
  it('should return session files for project directory', async () => {
    const db = createMockDb();
    // project lookup
    db._executeTakeFirst.mockResolvedValue({
      local_directory: '/Users/test/project',
      owner_id: 'user-1',
    });
    // collaborator directories
    db._execute.mockResolvedValueOnce([]);

    // readdir for encoded project path
    mockReaddir.mockResolvedValue([
      { name: 'session1.jsonl', isFile: () => true, isDirectory: () => false } as any,
    ]);
    mockStat.mockResolvedValue({ mtimeMs: Date.now() } as any);

    const result = await getProjectSessionFiles(db, 'proj-1');
    // Returns files matching the project's local directory
    expect(result).toBeDefined();
  });
});

describe('getProjectDirectoryOwners', () => {
  it('should return owner and collaborator directory mappings', async () => {
    const db = createMockDb();
    // project info
    db._executeTakeFirst.mockResolvedValue({
      local_directory: '/Users/test/project',
      owner_id: 'user-1',
    });
    // owner user
    db._executeTakeFirst.mockResolvedValueOnce({
      local_directory: '/Users/test/project',
      owner_id: 'user-1',
    });
    // collaborators
    db._execute.mockResolvedValue([]);

    const result = await getProjectDirectoryOwners(db, 'proj-1');
    expect(result).toBeInstanceOf(Map);
  });
});
