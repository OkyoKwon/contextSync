import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../quota/quota.service.js', () => ({
  detectPlan: vi.fn(),
}));

vi.mock('../../../lib/encryption.js', () => ({
  encrypt: vi.fn((val: string) => `encrypted:${val}`),
  decrypt: vi.fn((val: string) => val.replace('encrypted:', '')),
}));

import { detectPlan } from '../../quota/quota.service.js';
import {
  findOrCreateByEmail,
  findOrCreateByName,
  findUserById,
  updateUserPlan,
  updateApiKey,
  deleteApiKey,
  getUserApiKey,
  saveSupabaseToken,
  deleteSupabaseToken,
  getSupabaseToken,
} from '../auth.service.js';
import { AppError } from '../../../plugins/error-handler.plugin.js';

const mockDetectPlan = detectPlan as ReturnType<typeof vi.fn>;

const now = new Date('2025-01-01T00:00:00.000Z');

const makeUserRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  github_id: null,
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: null,
  role: 'user',
  is_auto: false,
  claude_plan: 'free',
  anthropic_api_key: null,
  supabase_access_token: null,
  plan_detection_source: null,
  created_at: now,
  updated_at: now,
  ...overrides,
});

function createMockDb() {
  const executeTakeFirst = vi.fn();
  const executeTakeFirstOrThrow = vi.fn();
  const execute = vi.fn();

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  chain.selectAll = vi.fn().mockReturnThis();
  chain.select = vi.fn().mockReturnThis();
  chain.where = vi.fn().mockReturnThis();
  chain.set = vi.fn().mockReturnThis();
  chain.values = vi.fn().mockReturnThis();
  chain.returningAll = vi.fn().mockReturnThis();
  chain.executeTakeFirst = executeTakeFirst;
  chain.executeTakeFirstOrThrow = executeTakeFirstOrThrow;
  chain.execute = execute;

  // Make every method return the chain for chaining
  for (const key of Object.keys(chain)) {
    if (key !== 'executeTakeFirst' && key !== 'executeTakeFirstOrThrow' && key !== 'execute') {
      chain[key] = vi.fn().mockReturnValue(chain);
    }
  }
  chain.executeTakeFirst = executeTakeFirst;
  chain.executeTakeFirstOrThrow = executeTakeFirstOrThrow;
  chain.execute = execute;

  const db = {
    selectFrom: vi.fn().mockReturnValue(chain),
    updateTable: vi.fn().mockReturnValue(chain),
    insertInto: vi.fn().mockReturnValue(chain),
    _chain: chain,
    _executeTakeFirst: executeTakeFirst,
    _executeTakeFirstOrThrow: executeTakeFirstOrThrow,
    _execute: execute,
  } as any;

  return db;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('findOrCreateByEmail', () => {
  it('should update existing user when email exists', async () => {
    const db = createMockDb();
    const existingRow = makeUserRow();
    const updatedRow = makeUserRow({ name: 'New Name' });

    db._executeTakeFirst.mockResolvedValueOnce(existingRow);
    db._executeTakeFirstOrThrow.mockResolvedValueOnce(updatedRow);

    const result = await findOrCreateByEmail(db, { name: 'New Name', email: 'test@example.com' });

    expect(result.name).toBe('New Name');
    expect(result.email).toBe('test@example.com');
    expect(db.updateTable).toHaveBeenCalledWith('users');
  });

  it('should create new user when email does not exist', async () => {
    const db = createMockDb();
    const createdRow = makeUserRow({ name: 'New User', email: 'new@example.com' });

    db._executeTakeFirst.mockResolvedValueOnce(undefined);
    db._executeTakeFirstOrThrow.mockResolvedValueOnce(createdRow);

    const result = await findOrCreateByEmail(db, { name: 'New User', email: 'new@example.com' });

    expect(result.name).toBe('New User');
    expect(db.insertInto).toHaveBeenCalledWith('users');
  });

  it('should map row fields to User domain object correctly', async () => {
    const db = createMockDb();
    const row = makeUserRow({
      github_id: 12345,
      avatar_url: 'https://avatar.url',
      anthropic_api_key: 'sk-test',
      supabase_access_token: 'token-123',
    });

    db._executeTakeFirst.mockResolvedValueOnce(undefined);
    db._executeTakeFirstOrThrow.mockResolvedValueOnce(row);

    const result = await findOrCreateByEmail(db, { name: 'Test User', email: 'test@example.com' });

    expect(result.githubId).toBe(12345);
    expect(result.avatarUrl).toBe('https://avatar.url');
    expect(result.hasAnthropicApiKey).toBe(true);
    expect(result.hasSupabaseToken).toBe(true);
    expect(result.createdAt).toBe('2025-01-01T00:00:00.000Z');
  });
});

describe('findOrCreateByName', () => {
  it('should return existing users when name matches', async () => {
    const db = createMockDb();
    const rows = [makeUserRow(), makeUserRow({ id: 'user-2' })];
    db._execute.mockResolvedValueOnce(rows);

    const result = await findOrCreateByName(db, 'Test User');

    expect(result.created).toBe(false);
    expect(result.users).toHaveLength(2);
  });

  it('should create new user when no name match exists', async () => {
    const db = createMockDb();
    const createdRow = makeUserRow({ name: 'NewUser' });

    db._execute.mockResolvedValueOnce([]);
    db._executeTakeFirstOrThrow.mockResolvedValueOnce(createdRow);

    const result = await findOrCreateByName(db, 'NewUser');

    expect(result.created).toBe(true);
    expect(result.users).toHaveLength(1);
    expect(db.insertInto).toHaveBeenCalledWith('users');
  });
});

describe('findUserById', () => {
  it('should return user when found and plan matches', async () => {
    const db = createMockDb();
    const row = makeUserRow({ claude_plan: 'pro' });
    db._executeTakeFirst.mockResolvedValueOnce(row);
    mockDetectPlan.mockResolvedValue({ plan: 'pro', source: 'cli' });

    const result = await findUserById(db, 'user-1');

    expect(result).not.toBeNull();
    expect(result!.claudePlan).toBe('pro');
  });

  it('should return null when user not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValueOnce(undefined);

    const result = await findUserById(db, 'nonexistent');

    expect(result).toBeNull();
  });

  it('should update plan when detected plan differs from stored', async () => {
    const db = createMockDb();
    const row = makeUserRow({ claude_plan: 'free' });
    const updatedRow = makeUserRow({ claude_plan: 'pro', plan_detection_source: 'cli' });

    db._executeTakeFirst.mockResolvedValueOnce(row);
    mockDetectPlan.mockResolvedValue({ plan: 'pro', source: 'cli' });
    db._executeTakeFirstOrThrow.mockResolvedValueOnce(updatedRow);

    const result = await findUserById(db, 'user-1');

    expect(result!.claudePlan).toBe('pro');
    expect(db.updateTable).toHaveBeenCalledWith('users');
  });
});

describe('updateUserPlan', () => {
  it('should update plan for valid plan type', async () => {
    const db = createMockDb();
    const updated = makeUserRow({ claude_plan: 'pro' });
    db._executeTakeFirst.mockResolvedValueOnce(updated);

    const result = await updateUserPlan(db, 'user-1', 'pro');

    expect(result.claudePlan).toBe('pro');
  });

  it('should throw AppError for invalid plan', async () => {
    const db = createMockDb();

    await expect(updateUserPlan(db, 'user-1', 'invalid' as any)).rejects.toThrow(AppError);
    await expect(updateUserPlan(db, 'user-1', 'invalid' as any)).rejects.toThrow(
      'Invalid Claude plan',
    );
  });

  it('should throw AppError when user not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValueOnce(undefined);

    await expect(updateUserPlan(db, 'nonexistent', 'pro')).rejects.toThrow('User not found');
  });
});

describe('updateApiKey', () => {
  it('should update API key and return user', async () => {
    const db = createMockDb();
    const updated = makeUserRow({ anthropic_api_key: 'sk-new' });
    db._executeTakeFirst.mockResolvedValueOnce(updated);

    const result = await updateApiKey(db, 'user-1', 'sk-new');

    expect(result.hasAnthropicApiKey).toBe(true);
  });

  it('should throw when user not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValueOnce(undefined);

    await expect(updateApiKey(db, 'nonexistent', 'sk-key')).rejects.toThrow('User not found');
  });
});

describe('deleteApiKey', () => {
  it('should set API key to null', async () => {
    const db = createMockDb();
    const updated = makeUserRow({ anthropic_api_key: null });
    db._executeTakeFirst.mockResolvedValueOnce(updated);

    const result = await deleteApiKey(db, 'user-1');

    expect(result.hasAnthropicApiKey).toBe(false);
  });

  it('should throw when user not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValueOnce(undefined);

    await expect(deleteApiKey(db, 'nonexistent')).rejects.toThrow('User not found');
  });
});

describe('getUserApiKey', () => {
  it('should return API key when present', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValueOnce({ anthropic_api_key: 'sk-test' });

    const result = await getUserApiKey(db, 'user-1');

    expect(result).toBe('sk-test');
  });

  it('should return null when no API key', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValueOnce({ anthropic_api_key: null });

    const result = await getUserApiKey(db, 'user-1');

    expect(result).toBeNull();
  });

  it('should return null when user not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValueOnce(undefined);

    const result = await getUserApiKey(db, 'nonexistent');

    expect(result).toBeNull();
  });
});

describe('saveSupabaseToken', () => {
  it('should encrypt and save token', async () => {
    const db = createMockDb();
    const updated = makeUserRow({ supabase_access_token: 'encrypted:my-token' });
    db._executeTakeFirst.mockResolvedValueOnce(updated);

    const result = await saveSupabaseToken(db, 'user-1', 'my-token', 'jwt-secret');

    expect(result.hasSupabaseToken).toBe(true);
  });

  it('should throw when user not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValueOnce(undefined);

    await expect(saveSupabaseToken(db, 'nonexistent', 'token', 'secret')).rejects.toThrow(
      'User not found',
    );
  });
});

describe('deleteSupabaseToken', () => {
  it('should set token to null', async () => {
    const db = createMockDb();
    const updated = makeUserRow({ supabase_access_token: null });
    db._executeTakeFirst.mockResolvedValueOnce(updated);

    const result = await deleteSupabaseToken(db, 'user-1');

    expect(result.hasSupabaseToken).toBe(false);
  });

  it('should throw when user not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValueOnce(undefined);

    await expect(deleteSupabaseToken(db, 'nonexistent')).rejects.toThrow('User not found');
  });
});

describe('getSupabaseToken', () => {
  it('should decrypt and return token', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValueOnce({ supabase_access_token: 'encrypted:my-token' });

    const result = await getSupabaseToken(db, 'user-1', 'jwt-secret');

    expect(result).toBe('my-token');
  });

  it('should return null when no token stored', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValueOnce({ supabase_access_token: null });

    const result = await getSupabaseToken(db, 'user-1', 'jwt-secret');

    expect(result).toBeNull();
  });

  it('should return null when user not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValueOnce(undefined);

    const result = await getSupabaseToken(db, 'nonexistent', 'jwt-secret');

    expect(result).toBeNull();
  });
});
