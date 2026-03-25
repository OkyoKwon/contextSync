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

import { useCurrentUser } from '../use-auth';

setupMsw();

describe('useCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
  });

  it('is disabled when no token', () => {
    const { result } = renderHookWithProviders(() => useCurrentUser());
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches user data when token exists', async () => {
    setMockAuthState({ token: 'valid-token' });
    const user = { id: 'user-1', name: 'Alice', email: 'alice@test.com' };
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ success: true, data: user, error: null })),
    );

    const { result } = renderHookWithProviders(() => useCurrentUser());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data?.name).toBe('Alice');
  });

  it('transitions to error on API failure', async () => {
    setMockAuthState({ token: 'expired-token' });
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json({ error: 'Invalid token' }, { status: 401 }),
      ),
    );

    const { result } = renderHookWithProviders(() => useCurrentUser());
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('returns full user object with all fields', async () => {
    setMockAuthState({ token: 'valid-token' });
    const user = {
      id: 'user-1',
      name: 'Bob',
      email: 'bob@test.com',
      claudePlan: 'pro',
      hasApiKey: true,
    };
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ success: true, data: user, error: null })),
    );

    const { result } = renderHookWithProviders(() => useCurrentUser());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toMatchObject({ id: 'user-1', claudePlan: 'pro' });
  });
});
