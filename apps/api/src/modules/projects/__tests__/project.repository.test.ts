import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createProject,
  findProjectById,
  updateProject,
  deleteProject,
  findProjectByJoinCode,
  updateJoinCode,
  updateDatabaseMode,
} from '../project.repository.js';

const now = new Date('2025-01-01T00:00:00.000Z');

const makeProjectRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'proj-1',
  owner_id: 'user-1',
  name: 'Test Project',
  description: null,
  repo_url: null,
  local_directory: null,
  join_code: null,
  database_mode: 'local',
  created_at: now,
  updated_at: now,
  ...overrides,
});

function createMockDb() {
  const executeTakeFirst = vi.fn();
  const executeTakeFirstOrThrow = vi.fn();
  const execute = vi.fn().mockResolvedValue(undefined);

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returningAll = vi.fn().mockReturnValue(chain);
  chain.selectAll = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.executeTakeFirst = executeTakeFirst;
  chain.executeTakeFirstOrThrow = executeTakeFirstOrThrow;
  chain.execute = execute;

  return {
    insertInto: vi.fn().mockReturnValue(chain),
    selectFrom: vi.fn().mockReturnValue(chain),
    updateTable: vi.fn().mockReturnValue(chain),
    deleteFrom: vi.fn().mockReturnValue(chain),
    _chain: chain,
    _executeTakeFirst: executeTakeFirst,
    _executeTakeFirstOrThrow: executeTakeFirstOrThrow,
    _execute: execute,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createProject', () => {
  it('should insert project and return domain object', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(makeProjectRow());

    const result = await createProject(db, 'user-1', { name: 'Test Project' });

    expect(db.insertInto).toHaveBeenCalledWith('projects');
    expect(result.id).toBe('proj-1');
    expect(result.ownerId).toBe('user-1');
    expect(result.name).toBe('Test Project');
    expect(result.databaseMode).toBe('local');
    expect(result.createdAt).toBe('2025-01-01T00:00:00.000Z');
  });

  it('should pass optional fields', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(
      makeProjectRow({
        description: 'A project',
        repo_url: 'https://github.com/test',
      }),
    );

    const result = await createProject(db, 'user-1', {
      name: 'Test',
      description: 'A project',
      repoUrl: 'https://github.com/test',
    });

    expect(result.description).toBe('A project');
    expect(result.repoUrl).toBe('https://github.com/test');
  });
});

describe('findProjectById', () => {
  it('should return project when found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(makeProjectRow());

    const result = await findProjectById(db, 'proj-1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('proj-1');
  });

  it('should return null when not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await findProjectById(db, 'nonexistent');

    expect(result).toBeNull();
  });
});

describe('updateProject', () => {
  it('should update and return project', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(makeProjectRow({ name: 'Updated' }));

    const result = await updateProject(db, 'proj-1', { name: 'Updated' });

    expect(result.name).toBe('Updated');
    expect(db.updateTable).toHaveBeenCalledWith('projects');
  });
});

describe('deleteProject', () => {
  it('should delete project by id', async () => {
    const db = createMockDb();

    await deleteProject(db, 'proj-1');

    expect(db.deleteFrom).toHaveBeenCalledWith('projects');
    expect(db._chain.where).toHaveBeenCalledWith('id', '=', 'proj-1');
  });
});

describe('findProjectByJoinCode', () => {
  it('should return project when code matches', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(makeProjectRow({ join_code: 'ABC123' }));

    const result = await findProjectByJoinCode(db, 'ABC123');

    expect(result).not.toBeNull();
    expect(result!.joinCode).toBe('ABC123');
  });

  it('should return null when code not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await findProjectByJoinCode(db, 'INVALID');

    expect(result).toBeNull();
  });
});

describe('updateJoinCode', () => {
  it('should set join code and return project', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(makeProjectRow({ join_code: 'NEW123' }));

    const result = await updateJoinCode(db, 'proj-1', 'NEW123');

    expect(result.joinCode).toBe('NEW123');
  });

  it('should clear join code when null', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue(makeProjectRow({ join_code: null }));

    const result = await updateJoinCode(db, 'proj-1', null);

    expect(result.joinCode).toBeNull();
  });
});

describe('updateDatabaseMode', () => {
  it('should update database mode', async () => {
    const db = createMockDb();

    await updateDatabaseMode(db, 'proj-1', 'remote');

    expect(db.updateTable).toHaveBeenCalledWith('projects');
    expect(db._chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        database_mode: 'remote',
      }),
    );
  });
});
