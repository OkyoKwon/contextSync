import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import {
  createAuthStoreMock,
  setMockAuthState,
  resetMockAuthState,
} from '../../test/mocks/auth-store.mock';
import { renderHookWithProviders, waitFor, setupMsw } from '../../test/test-utils';

// useProjects doesn't use auth store directly, but api/client.ts does via getState()
vi.mock('../../stores/auth.store', () => createAuthStoreMock());

import { useProjects } from '../use-projects';

setupMsw();

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'tok' });
  });

  it('fetches project list on mount', async () => {
    const projects = [
      { id: 'p1', name: 'Project A', ownerId: 'u1', collaboratorCount: 2, isTeam: true },
      { id: 'p2', name: 'Project B', ownerId: 'u1', collaboratorCount: 0, isTeam: false },
    ];
    server.use(
      http.get('/api/projects', () =>
        HttpResponse.json({ success: true, data: projects, error: null }),
      ),
    );

    const { result } = renderHookWithProviders(() => useProjects());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data?.[0]?.name).toBe('Project A');
  });

  it('returns empty array when no projects', async () => {
    server.use(
      http.get('/api/projects', () => HttpResponse.json({ success: true, data: [], error: null })),
    );

    const { result } = renderHookWithProviders(() => useProjects());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual([]);
  });

  it('transitions to error state on API failure', async () => {
    server.use(
      http.get('/api/projects', () =>
        HttpResponse.json({ error: 'Database error' }, { status: 500 }),
      ),
    );

    const { result } = renderHookWithProviders(() => useProjects());
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('handles success:false response as error', async () => {
    server.use(
      http.get('/api/projects', () =>
        HttpResponse.json({ success: false, data: null, error: 'Forbidden' }),
      ),
    );

    const { result } = renderHookWithProviders(() => useProjects());
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
