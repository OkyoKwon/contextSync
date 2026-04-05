import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findCollaboratorsByProjectId,
  addCollaborator,
  removeCollaborator,
  findCollaboratorByProjectAndUser,
} from '../collaborator.repository.js';

const now = new Date('2025-01-01T00:00:00.000Z');

function createMockDb() {
  const executeTakeFirst = vi.fn();
  const execute = vi.fn().mockResolvedValue([]);

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.values = vi.fn().mockReturnValue(chain);
  chain.selectAll = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.executeTakeFirst = executeTakeFirst;
  chain.execute = execute;

  return {
    insertInto: vi.fn().mockReturnValue(chain),
    selectFrom: vi.fn().mockReturnValue(chain),
    deleteFrom: vi.fn().mockReturnValue(chain),
    _chain: chain,
    _executeTakeFirst: executeTakeFirst,
    _execute: execute,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('findCollaboratorsByProjectId', () => {
  it('should return collaborators with user info', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValue([
      {
        id: 'collab-1',
        project_id: 'proj-1',
        user_id: 'user-1',
        role: 'member',
        local_directory: '/path',
        added_at: now,
        user_name: 'User 1',
        user_email: 'u@test.com',
        user_avatar_url: null,
      },
    ]);

    const result = await findCollaboratorsByProjectId(db, 'proj-1');

    expect(result).toHaveLength(1);
    expect(result[0]!.userId).toBe('user-1');
    expect(result[0]!.userName).toBe('User 1');
    expect(result[0]!.addedAt).toBe('2025-01-01T00:00:00.000Z');
  });

  it('should return empty array when no collaborators', async () => {
    const db = createMockDb();
    const result = await findCollaboratorsByProjectId(db, 'proj-1');
    expect(result).toEqual([]);
  });
});

describe('addCollaborator', () => {
  it('should insert collaborator record', async () => {
    const db = createMockDb();
    await addCollaborator(db, 'proj-1', 'user-1', 'member');
    expect(db.insertInto).toHaveBeenCalledWith('project_collaborators');
    expect(db._chain.values).toHaveBeenCalledWith({
      project_id: 'proj-1',
      user_id: 'user-1',
      role: 'member',
    });
  });
});

describe('removeCollaborator', () => {
  it('should delete collaborator by project and user', async () => {
    const db = createMockDb();
    await removeCollaborator(db, 'proj-1', 'user-1');
    expect(db.deleteFrom).toHaveBeenCalledWith('project_collaborators');
  });
});

describe('findCollaboratorByProjectAndUser', () => {
  it('should return collaborator when found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue({
      id: 'collab-1',
      project_id: 'proj-1',
      user_id: 'user-1',
      role: 'member',
      local_directory: null,
      added_at: now,
      user_name: 'User',
      user_email: 'u@t.com',
      user_avatar_url: null,
    });

    const result = await findCollaboratorByProjectAndUser(db, 'proj-1', 'user-1');
    expect(result).not.toBeNull();
    expect(result!.userId).toBe('user-1');
  });

  it('should return null when not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);
    const result = await findCollaboratorByProjectAndUser(db, 'proj-1', 'stranger');
    expect(result).toBeNull();
  });
});
