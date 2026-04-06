import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import {
  createAuthStoreMock,
  setMockAuthState,
  resetMockAuthState,
} from '../../test/mocks/auth-store.mock';
import { renderHookWithProviders, waitFor, setupMsw } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => createAuthStoreMock());

import {
  useSessions,
  useSession,
  useImportSession,
  useDeleteSession,
  useUpdateSession,
  useRecalculateTokens,
  useTimeline,
  useTokenUsage,
  useDashboardStats,
  useTeamStats,
} from '../use-sessions';

setupMsw();

describe('useSessions hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
  });

  describe('useSessions', () => {
    it('is disabled when no projectId', () => {
      const { result } = renderHookWithProviders(() => useSessions());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('is disabled when projectId is "skipped"', () => {
      setMockAuthState({ currentProjectId: 'skipped' });
      const { result } = renderHookWithProviders(() => useSessions());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches sessions and returns data on success', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const sessions = [
        { id: 's1', title: 'Session 1', status: 'active' },
        { id: 's2', title: 'Session 2', status: 'completed' },
      ];
      server.use(
        http.get('/api/projects/p1/sessions', () =>
          HttpResponse.json({ success: true, data: sessions, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useSessions());
      expect(result.current.isLoading).toBe(true);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toEqual(sessions);
    });

    it('passes filter as query params', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      let capturedUrl = '';
      server.use(
        http.get('/api/projects/p1/sessions', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ success: true, data: [], error: null });
        }),
      );

      const { result } = renderHookWithProviders(() => useSessions({ status: 'active' } as any));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain('status=active');
    });

    it('transitions to error state on API failure', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      server.use(
        http.get('/api/projects/p1/sessions', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 }),
        ),
      );

      const { result } = renderHookWithProviders(() => useSessions());
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useSession', () => {
    it('is disabled with empty sessionId', () => {
      const { result } = renderHookWithProviders(() => useSession(''));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches session detail on success', async () => {
      setMockAuthState({ token: 'tok' });
      const session = { id: 'sess-1', title: 'My Session', messages: [] };
      server.use(
        http.get('/api/sessions/sess-1', () =>
          HttpResponse.json({ success: true, data: session, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useSession('sess-1'));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data?.id).toBe('sess-1');
    });

    it('transitions to error on 404', async () => {
      setMockAuthState({ token: 'tok' });
      server.use(
        http.get('/api/sessions/nonexistent', () =>
          HttpResponse.json({ error: 'Not found' }, { status: 404 }),
        ),
      );

      const { result } = renderHookWithProviders(() => useSession('nonexistent'));
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useImportSession', () => {
    it('returns mutate function', () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const { result } = renderHookWithProviders(() => useImportSession());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls import endpoint with file', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      let capturedContentType = '';
      server.use(
        http.post('/api/projects/p1/sessions/import', ({ request }) => {
          capturedContentType = request.headers.get('Content-Type') ?? '';
          return HttpResponse.json({
            success: true,
            data: { sessionId: 'new-sess', messageCount: 5 },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useImportSession());
      const file = new File(['{"messages":[]}'], 'test.json', { type: 'application/json' });
      result.current.mutate(file);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedContentType).not.toBe('application/json');
    });
  });

  describe('useTimeline', () => {
    it('is disabled when projectId is "skipped"', () => {
      setMockAuthState({ currentProjectId: 'skipped' });
      const { result } = renderHookWithProviders(() => useTimeline());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches timeline data', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const timeline = [{ date: '2025-03-01', sessions: [] }];
      server.use(
        http.get('/api/projects/p1/timeline', () =>
          HttpResponse.json({ success: true, data: timeline, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useTimeline());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toEqual(timeline);
    });
  });

  describe('useTokenUsage', () => {
    it('fetches with default period 30d', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      let capturedUrl = '';
      server.use(
        http.get('/api/projects/p1/token-usage', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            success: true,
            data: {
              period: '30d',
              totalTokens: 100,
              totalCost: 0.5,
              totalMessages: 10,
              measuredMessages: 8,
              periodStart: '2025-02-01',
              periodEnd: '2025-03-01',
              modelBreakdown: [],
              dailyUsage: [],
            },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useTokenUsage());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain('period=30d');
      expect(result.current.data?.data?.totalTokens).toBe(100);
    });

    it('accepts custom period', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      let capturedUrl = '';
      server.use(
        http.get('/api/projects/p1/token-usage', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            success: true,
            data: {
              period: '7d',
              totalInputTokens: 0,
              totalOutputTokens: 0,
              totalCost: 0,
              dailyUsage: [],
            },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useTokenUsage('7d'));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain('period=7d');
    });
  });

  describe('useDashboardStats', () => {
    it('fetches dashboard stats', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const stats = { todaySessions: 10, activeSessions: 3, totalTokens: 5000, totalCost: 1.5 };
      server.use(
        http.get('/api/projects/p1/stats', () =>
          HttpResponse.json({ success: true, data: stats, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useDashboardStats());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data?.todaySessions).toBe(10);
    });

    it('is disabled without projectId', () => {
      const { result } = renderHookWithProviders(() => useDashboardStats());
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useTeamStats', () => {
    it('is disabled without projectId', () => {
      const { result } = renderHookWithProviders(() => useTeamStats());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches team stats', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const teamStats = [{ userId: 'u1', name: 'Alice', sessionCount: 5 }];
      server.use(
        http.get('/api/projects/p1/team-stats', () =>
          HttpResponse.json({ success: true, data: teamStats, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useTeamStats());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toHaveLength(1);
    });
  });

  describe('useDeleteSession', () => {
    it('returns mutate function', () => {
      const { result } = renderHookWithProviders(() => useDeleteSession());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls DELETE endpoint', async () => {
      setMockAuthState({ token: 'tok' });
      let wasCalled = false;
      server.use(
        http.delete('/api/sessions/sess-1', () => {
          wasCalled = true;
          return HttpResponse.json({ success: true, data: null, error: null });
        }),
      );

      const { result } = renderHookWithProviders(() => useDeleteSession());
      result.current.mutate('sess-1');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(wasCalled).toBe(true);
    });
  });

  describe('useUpdateSession', () => {
    it('returns mutate function', () => {
      const { result } = renderHookWithProviders(() => useUpdateSession());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls PATCH endpoint with title', async () => {
      setMockAuthState({ token: 'tok' });
      let capturedBody: any = null;
      server.use(
        http.patch('/api/sessions/sess-1', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            success: true,
            data: { id: 'sess-1', title: 'Updated' },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useUpdateSession());
      result.current.mutate({ sessionId: 'sess-1', title: 'Updated' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedBody).toEqual({ title: 'Updated' });
    });

    it('calls PATCH endpoint with status', async () => {
      setMockAuthState({ token: 'tok' });
      let capturedBody: any = null;
      server.use(
        http.patch('/api/sessions/sess-1', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            success: true,
            data: { id: 'sess-1', status: 'completed' },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useUpdateSession());
      result.current.mutate({ sessionId: 'sess-1', status: 'completed' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedBody).toEqual({ status: 'completed' });
    });
  });

  describe('useRecalculateTokens', () => {
    it('returns mutate function', () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const { result } = renderHookWithProviders(() => useRecalculateTokens());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls recalculate-tokens POST endpoint', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      let wasCalled = false;
      server.use(
        http.post('/api/projects/p1/sessions/recalculate-tokens', () => {
          wasCalled = true;
          return HttpResponse.json({
            success: true,
            data: { updatedCount: 3 },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useRecalculateTokens());
      result.current.mutate();
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(wasCalled).toBe(true);
    });
  });
});
