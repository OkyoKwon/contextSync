import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { createAuthStoreMock, resetMockAuthState } from '../../test/mocks/auth-store.mock';
import { renderHookWithProviders, waitFor, setupMsw } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => createAuthStoreMock());

import { useDatabaseStatus } from '../use-database-status';

setupMsw();

describe('useDatabaseStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
  });

  it('starts loading on mount', () => {
    const { result } = renderHookWithProviders(() => useDatabaseStatus());
    expect(result.current.isLoading).toBe(true);
  });

  it('transitions to success with data', async () => {
    const statusData = {
      databaseMode: 'local',
      provider: 'local',
      host: 'localhost',
      remoteUrl: null,
    };
    server.use(
      http.get('/api/setup/status', () =>
        HttpResponse.json({ success: true, data: statusData, error: null }),
      ),
    );

    const { result } = renderHookWithProviders(() => useDatabaseStatus());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data?.databaseMode).toBe('local');
    expect(result.current.data?.data?.provider).toBe('local');
    expect(result.current.data?.data?.host).toBe('localhost');
    expect(result.current.data?.data?.remoteUrl).toBeNull();
  });

  it('transitions to error on API failure', async () => {
    server.use(
      http.get('/api/setup/status', () =>
        HttpResponse.json({ error: 'Server error' }, { status: 500 }),
      ),
    );

    const { result } = renderHookWithProviders(() => useDatabaseStatus());
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
