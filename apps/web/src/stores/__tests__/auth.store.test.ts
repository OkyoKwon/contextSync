import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { User } from '@context-sync/shared';

// Mock localStorage before importing stores
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((_i: number) => null),
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

let useAuthStore: typeof import('../auth.store').useAuthStore;

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('useAuthStore', () => {
  beforeEach(async () => {
    localStorageMock.clear();
    // Re-import to get fresh store
    vi.resetModules();
    const mod = await import('../auth.store');
    useAuthStore = mod.useAuthStore;
  });

  it('has null initial state', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.currentProjectId).toBeNull();
  });

  it('setAuth sets token and user', () => {
    useAuthStore.getState().setAuth('jwt-token', mockUser);
    const state = useAuthStore.getState();
    expect(state.token).toBe('jwt-token');
    expect(state.user).toEqual(mockUser);
  });

  it('setCurrentProject sets projectId', () => {
    useAuthStore.getState().setCurrentProject('project-1');
    expect(useAuthStore.getState().currentProjectId).toBe('project-1');
  });

  it('setCurrentProject accepts null', () => {
    useAuthStore.getState().setCurrentProject('project-1');
    useAuthStore.getState().setCurrentProject(null);
    expect(useAuthStore.getState().currentProjectId).toBeNull();
  });

  it('logout resets all state to null', () => {
    useAuthStore.getState().setAuth('jwt-token', mockUser);
    useAuthStore.getState().setCurrentProject('project-1');
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.currentProjectId).toBeNull();
  });

  it('setAuth then logout clears everything', () => {
    useAuthStore.getState().setAuth('token', mockUser);
    expect(useAuthStore.getState().token).toBe('token');
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().token).toBeNull();
  });
});
