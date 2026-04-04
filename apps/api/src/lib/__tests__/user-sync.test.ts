import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncUserToRemote } from '../user-sync.js';

function createMockDb() {
  const execute = vi.fn().mockResolvedValue(undefined);

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.values = vi.fn().mockReturnValue(chain);
  chain.onConflict = vi.fn().mockReturnValue(chain);
  chain.column = vi.fn().mockReturnValue(chain);
  chain.doUpdateSet = vi.fn().mockReturnValue(chain);
  chain.execute = execute;

  // onConflict takes a callback — execute it
  chain.onConflict = vi.fn().mockImplementation((cb: (oc: any) => any) => {
    const ocBuilder = {
      column: vi.fn().mockReturnValue({
        doUpdateSet: vi.fn().mockReturnValue(chain),
      }),
    };
    cb(ocBuilder);
    return chain;
  });

  return {
    insertInto: vi.fn().mockReturnValue(chain),
    _chain: chain,
    _execute: execute,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('syncUserToRemote', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: 'https://avatar.url',
    githubId: null,
    role: 'user' as const,
    claudePlan: 'free' as const,
    hasAnthropicApiKey: false,
    hasSupabaseToken: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };

  it('should insert user into remote DB with upsert', async () => {
    const db = createMockDb();

    await syncUserToRemote(db, mockUser);

    expect(db.insertInto).toHaveBeenCalledWith('users');
    expect(db._chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://avatar.url',
      }),
    );
  });

  it('should handle user without avatar', async () => {
    const db = createMockDb();

    await syncUserToRemote(db, { ...mockUser, avatarUrl: null });

    expect(db._chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        avatar_url: null,
      }),
    );
  });
});
