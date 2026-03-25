import { vi } from 'vitest';

/**
 * Creates a mock that satisfies both Zustand hook usage patterns:
 * 1. `useAuthStore((s) => s.currentProjectId)` — called as a function with selector
 * 2. `useAuthStore.getState().token` — called via getState() in api/client.ts
 *
 * Usage in test files:
 *   vi.mock('../../stores/auth.store', () => createAuthStoreMock());
 *   import { useAuthStore } from '../../stores/auth.store';
 *   ...
 *   setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
 */

interface MockAuthState {
  token: string | null;
  user: { id: string; name: string; email: string } | null;
  currentProjectId: string | null;
  setAuth: ReturnType<typeof vi.fn>;
  setCurrentProject: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
}

let store: MockAuthState;

function resetStore() {
  store = {
    token: null,
    user: null,
    currentProjectId: null,
    setAuth: vi.fn((token: string, user: any) => {
      store.token = token;
      store.user = user;
    }),
    setCurrentProject: vi.fn((id: string | null) => {
      store.currentProjectId = id;
    }),
    logout: vi.fn(() => {
      store.token = null;
      store.user = null;
      store.currentProjectId = null;
    }),
  };
}

// Initialize
resetStore();

/**
 * Set mock auth state for tests. Call this in beforeEach or inside individual tests.
 */
export function setMockAuthState(
  partial: Partial<Pick<MockAuthState, 'token' | 'user' | 'currentProjectId'>>,
) {
  Object.assign(store, partial);
}

/**
 * Reset mock auth state. Call in beforeEach.
 */
export function resetMockAuthState() {
  resetStore();
}

/**
 * Returns the vi.mock factory result. Use with:
 *   vi.mock('../../stores/auth.store', () => createAuthStoreMock());
 */
export function createAuthStoreMock() {
  resetStore();

  // The function itself acts as the hook (selector pattern)
  const hookFn = (selector: (s: MockAuthState) => unknown) => selector(store);

  // Attach getState/setState for imperative access (used by api/client.ts)
  hookFn.getState = () => store;
  hookFn.setState = (partial: Partial<MockAuthState>) => Object.assign(store, partial);

  return { useAuthStore: hookFn };
}
