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

import { useActivity } from '../use-activity';

setupMsw();

describe('useActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
  });

  it('is disabled without projectId', () => {
    const { result } = renderHookWithProviders(() => useActivity());
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled when projectId is "skipped"', () => {
    setMockAuthState({ currentProjectId: 'skipped' });
    const { result } = renderHookWithProviders(() => useActivity());
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches activity data on success', async () => {
    setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
    const activities = [
      { id: 'a1', type: 'session_created', userId: 'u1', createdAt: '2025-03-01T00:00:00Z' },
      { id: 'a2', type: 'session_updated', userId: 'u2', createdAt: '2025-03-02T00:00:00Z' },
    ];
    server.use(
      http.get('/api/projects/p1/activity', () =>
        HttpResponse.json({ success: true, data: activities, error: null }),
      ),
    );

    const { result } = renderHookWithProviders(() => useActivity());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data?.[0]!.id).toBe('a1');
  });

  it('passes page and limit as query params', async () => {
    setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
    let capturedUrl = '';
    server.use(
      http.get('/api/projects/p1/activity', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], error: null });
      }),
    );

    const { result } = renderHookWithProviders(() => useActivity(3, 10));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('page=3');
    expect(capturedUrl).toContain('limit=10');
  });

  it('transitions to error on API failure', async () => {
    setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
    server.use(
      http.get('/api/projects/p1/activity', () =>
        HttpResponse.json({ error: 'Server error' }, { status: 500 }),
      ),
    );

    const { result } = renderHookWithProviders(() => useActivity());
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
