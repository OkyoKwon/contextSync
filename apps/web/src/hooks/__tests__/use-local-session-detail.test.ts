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

import { useLocalSessionDetail } from '../use-local-session-detail';

setupMsw();

describe('useLocalSessionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
  });

  it('is disabled when sessionId is null', () => {
    const { result } = renderHookWithProviders(() => useLocalSessionDetail(null));
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is loading when sessionId is provided', () => {
    setMockAuthState({ token: 'tok' });
    const { result } = renderHookWithProviders(() => useLocalSessionDetail('session-1'));
    expect(result.current.isLoading).toBe(true);
  });

  it('transitions to success with session data', async () => {
    setMockAuthState({ token: 'tok' });
    const sessionData = {
      id: 'session-1',
      title: 'Test Session',
      projectPath: '/home/user/project',
      messageCount: 10,
    };
    server.use(
      http.get('/api/sessions/local/session-1', () =>
        HttpResponse.json({ success: true, data: sessionData, error: null }),
      ),
    );

    const { result } = renderHookWithProviders(() => useLocalSessionDetail('session-1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data?.id).toBe('session-1');
    expect(result.current.data?.data?.title).toBe('Test Session');
  });

  it('transitions to error on API failure', async () => {
    setMockAuthState({ token: 'tok' });
    server.use(
      http.get('/api/sessions/local/session-1', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    );

    const { result } = renderHookWithProviders(() => useLocalSessionDetail('session-1'));
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
