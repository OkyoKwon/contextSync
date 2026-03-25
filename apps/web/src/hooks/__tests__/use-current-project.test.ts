import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import {
  createAuthStoreMock,
  setMockAuthState,
  resetMockAuthState,
} from '../../test/mocks/auth-store.mock';
import { renderHookWithProviders, waitFor, setupMsw } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => createAuthStoreMock());

import { useCurrentProject } from '../use-current-project';

setupMsw();

describe('useCurrentProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
  });

  it('is disabled when projectId is null', () => {
    setMockAuthState({ token: 'tok', currentProjectId: null });
    const { result } = renderHookWithProviders(() => useCurrentProject());
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled when projectId is "skipped"', () => {
    setMockAuthState({ token: 'tok', currentProjectId: 'skipped' });
    const { result } = renderHookWithProviders(() => useCurrentProject());
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches project when projectId exists', async () => {
    setMockAuthState({ token: 'tok', currentProjectId: 'proj-1' });

    server.use(
      http.get('/api/projects/proj-1', () =>
        HttpResponse.json({
          success: true,
          data: { id: 'proj-1', name: 'Test Project', ownerId: 'user-1' },
          error: null,
        }),
      ),
    );

    const { result } = renderHookWithProviders(() => useCurrentProject());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data?.id).toBe('proj-1');
    expect(result.current.data?.data?.name).toBe('Test Project');
  });

  it('handles error response', async () => {
    setMockAuthState({ token: 'tok', currentProjectId: 'proj-missing' });

    server.use(
      http.get('/api/projects/proj-missing', () =>
        HttpResponse.json(
          { success: false, data: null, error: 'Project not found' },
          { status: 404 },
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useCurrentProject());
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
