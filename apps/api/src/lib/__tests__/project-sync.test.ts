import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../user-sync.js', () => ({
  syncUserToRemote: vi.fn(),
}));

import { syncUserToRemote } from '../user-sync.js';
import { ensureUserOnRemote, syncProjectToRemote } from '../project-sync.js';

const mockSyncUserToRemote = syncUserToRemote as ReturnType<typeof vi.fn>;

function makeChainableDb(returnValue: unknown = undefined) {
  const chain = {
    selectFrom: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    executeTakeFirst: vi.fn().mockResolvedValue(returnValue),
    insertInto: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflict: vi.fn().mockImplementation((cb: (oc: unknown) => unknown) => {
      const oc = {
        column: vi.fn().mockReturnValue({
          doUpdateSet: vi.fn().mockReturnValue(chain),
        }),
      };
      cb(oc);
      return chain;
    }),
    execute: vi.fn().mockResolvedValue(undefined),
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ensureUserOnRemote', () => {
  it('reads user from localDb and writes to remoteDb', async () => {
    const userRow = { id: 'u1', name: 'Alice', email: 'a@test.com', avatar_url: null };
    const localDb = makeChainableDb(userRow) as any;
    const remoteDb = {} as any;

    await ensureUserOnRemote(localDb, remoteDb, 'u1');

    expect(localDb.selectFrom).toHaveBeenCalledWith('users');
    expect(mockSyncUserToRemote).toHaveBeenCalledWith(
      remoteDb,
      expect.objectContaining({ id: 'u1', name: 'Alice', email: 'a@test.com' }),
    );
  });

  it('does nothing if user not found', async () => {
    const localDb = makeChainableDb(undefined) as any;
    const remoteDb = {} as any;

    await ensureUserOnRemote(localDb, remoteDb, 'missing');

    expect(mockSyncUserToRemote).not.toHaveBeenCalled();
  });

  it('is safe to call repeatedly (idempotent)', async () => {
    const userRow = { id: 'u1', name: 'Alice', email: 'a@test.com', avatar_url: null };
    const localDb = makeChainableDb(userRow) as any;
    const remoteDb = {} as any;
    mockSyncUserToRemote.mockResolvedValue(undefined);

    await ensureUserOnRemote(localDb, remoteDb, 'u1');
    await ensureUserOnRemote(localDb, remoteDb, 'u1');

    expect(mockSyncUserToRemote).toHaveBeenCalledTimes(2);
  });
});

describe('syncProjectToRemote', () => {
  it('ensures owner user first, then upserts project', async () => {
    const userRow = { id: 'owner-1', name: 'Owner', email: 'o@test.com', avatar_url: null };
    const projectRow = {
      id: 'proj-1',
      owner_id: 'owner-1',
      name: 'My Project',
      description: 'desc',
      repo_url: null,
      local_directory: '/path',
      database_mode: 'local',
    };

    const callOrder: string[] = [];
    mockSyncUserToRemote.mockImplementation(async () => {
      callOrder.push('syncUser');
    });

    // localDb needs to return userRow for ensureUserOnRemote, then projectRow for project query
    const localDb = {
      selectFrom: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValueOnce(userRow).mockResolvedValueOnce(projectRow),
    } as any;

    const remoteDb = makeChainableDb() as any;
    remoteDb.execute.mockImplementation(async () => {
      callOrder.push('insertProject');
    });

    await syncProjectToRemote(localDb, remoteDb, 'proj-1', 'owner-1');

    expect(callOrder).toEqual(['syncUser', 'insertProject']);
  });

  it('sets database_mode to remote on insert', async () => {
    const userRow = { id: 'owner-1', name: 'Owner', email: 'o@test.com', avatar_url: null };
    const projectRow = {
      id: 'proj-1',
      owner_id: 'owner-1',
      name: 'P',
      description: null,
      repo_url: null,
      local_directory: null,
      database_mode: 'local',
    };

    const localDb = {
      selectFrom: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValueOnce(userRow).mockResolvedValueOnce(projectRow),
    } as any;

    const remoteDb = makeChainableDb() as any;

    await syncProjectToRemote(localDb, remoteDb, 'proj-1', 'owner-1');

    expect(remoteDb.insertInto).toHaveBeenCalledWith('projects');
    expect(remoteDb.values).toHaveBeenCalledWith(
      expect.objectContaining({ database_mode: 'remote' }),
    );
  });

  it('does nothing if project not found', async () => {
    const userRow = { id: 'owner-1', name: 'Owner', email: 'o@test.com', avatar_url: null };

    const localDb = {
      selectFrom: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      executeTakeFirst: vi
        .fn()
        .mockResolvedValueOnce(userRow) // user found for ensureUserOnRemote
        .mockResolvedValueOnce(undefined), // project not found
    } as any;

    const remoteDb = makeChainableDb() as any;

    await syncProjectToRemote(localDb, remoteDb, 'missing', 'owner-1');

    expect(remoteDb.insertInto).not.toHaveBeenCalled();
  });
});
