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

import { useCollaborators } from '../use-collaborators';

setupMsw();

describe('useCollaborators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'tok' });
  });

  it('is disabled when projectId is null', () => {
    const { result } = renderHookWithProviders(() => useCollaborators(null));
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled when projectId is "skipped"', () => {
    const { result } = renderHookWithProviders(() => useCollaborators('skipped'));
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches collaborators when projectId exists', async () => {
    server.use(
      http.get('/api/projects/proj-1/collaborators', () =>
        HttpResponse.json({
          success: true,
          data: [
            { userId: 'u1', name: 'Alice', role: 'owner' },
            { userId: 'u2', name: 'Bob', role: 'member' },
          ],
          error: null,
        }),
      ),
    );

    const { result } = renderHookWithProviders(() => useCollaborators('proj-1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
  });

  it('handles error response', async () => {
    server.use(
      http.get('/api/projects/proj-1/collaborators', () =>
        HttpResponse.json(
          { success: false, data: null, error: 'Project not found' },
          { status: 404 },
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useCollaborators('proj-1'));
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
