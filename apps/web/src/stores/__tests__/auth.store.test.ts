import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { User } from '@context-sync/shared';

let useAuthStore: typeof import('../auth.store').useAuthStore;

const mockUser: User = {
  id: 'user-1',
  githubId: null,
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  role: 'owner',
  claudePlan: 'free',
  hasAnthropicApiKey: false,
  hasSupabaseToken: false,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('useAuthStore', () => {
  beforeEach(async () => {
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
