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

import {
  useConflicts,
  useConflict,
  useUpdateConflict,
  useAssignReviewer,
  useAddReviewNotes,
  useBatchResolveConflicts,
  useAiVerifyConflict,
  useConflictOverview,
} from '../use-conflicts';

setupMsw();

describe('useConflicts hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
  });

  describe('useConflicts', () => {
    it('is disabled when no projectId', () => {
      const { result } = renderHookWithProviders(() => useConflicts());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('is disabled when projectId is "skipped"', () => {
      setMockAuthState({ currentProjectId: 'skipped' });
      const { result } = renderHookWithProviders(() => useConflicts());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('respects enabled option', () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const { result } = renderHookWithProviders(() => useConflicts(undefined, { enabled: false }));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches conflicts with projectId', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const conflicts = [
        { id: 'c1', severity: 'warning', status: 'open', filePath: '/src/a.ts' },
        { id: 'c2', severity: 'critical', status: 'open', filePath: '/src/b.ts' },
      ];
      server.use(
        http.get('/api/projects/p1/conflicts', () =>
          HttpResponse.json({ success: true, data: conflicts, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useConflicts());
      expect(result.current.isLoading).toBe(true);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toHaveLength(2);
      expect(result.current.data?.data?.[0]?.severity).toBe('warning');
    });

    it('passes filter as query params', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      let capturedUrl = '';
      server.use(
        http.get('/api/projects/p1/conflicts', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ success: true, data: [], error: null });
        }),
      );

      const { result } = renderHookWithProviders(() =>
        useConflicts({ severity: 'critical' } as any),
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain('severity=critical');
    });

    it('transitions to error on API failure', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      server.use(
        http.get('/api/projects/p1/conflicts', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 }),
        ),
      );

      const { result } = renderHookWithProviders(() => useConflicts());
      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('returns empty array when no conflicts', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });

      const { result } = renderHookWithProviders(() => useConflicts());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toEqual([]);
    });
  });

  describe('useConflict', () => {
    it('is disabled with empty conflictId', () => {
      const { result } = renderHookWithProviders(() => useConflict(''));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches single conflict detail', async () => {
      setMockAuthState({ token: 'tok' });
      const conflict = {
        id: 'c-1',
        severity: 'critical',
        status: 'open',
        filePath: '/src/main.ts',
      };
      server.use(
        http.get('/api/conflicts/c-1', () =>
          HttpResponse.json({ success: true, data: conflict, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useConflict('c-1'));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data?.id).toBe('c-1');
    });

    it('transitions to error on 404', async () => {
      setMockAuthState({ token: 'tok' });
      server.use(
        http.get('/api/conflicts/nonexistent', () =>
          HttpResponse.json({ error: 'Not found' }, { status: 404 }),
        ),
      );

      const { result } = renderHookWithProviders(() => useConflict('nonexistent'));
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useUpdateConflict', () => {
    it('returns mutate function', () => {
      const { result } = renderHookWithProviders(() => useUpdateConflict());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls update endpoint with correct data', async () => {
      setMockAuthState({ token: 'tok' });
      let capturedBody: any = null;
      server.use(
        http.patch('/api/conflicts/c-1', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            success: true,
            data: { id: 'c-1', status: 'resolved' },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useUpdateConflict());
      result.current.mutate({ id: 'c-1', input: { status: 'resolved' } as any });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedBody).toEqual({ status: 'resolved' });
    });
  });

  describe('useAssignReviewer', () => {
    it('calls assign endpoint', async () => {
      setMockAuthState({ token: 'tok' });
      let capturedBody: any = null;
      server.use(
        http.patch('/api/conflicts/c-1/assign', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            success: true,
            data: { id: 'c-1', reviewerId: 'u2' },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useAssignReviewer());
      result.current.mutate({ conflictId: 'c-1', reviewerId: 'u2' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedBody).toEqual({ reviewerId: 'u2' });
    });
  });

  describe('useAddReviewNotes', () => {
    it('calls review-notes endpoint', async () => {
      setMockAuthState({ token: 'tok' });
      let capturedBody: any = null;
      server.use(
        http.patch('/api/conflicts/c-1/review-notes', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            success: true,
            data: { id: 'c-1', reviewNotes: 'LGTM' },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useAddReviewNotes());
      result.current.mutate({ conflictId: 'c-1', reviewNotes: 'LGTM' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedBody).toEqual({ reviewNotes: 'LGTM' });
    });
  });

  describe('useBatchResolveConflicts', () => {
    it('returns mutate function', () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const { result } = renderHookWithProviders(() => useBatchResolveConflicts());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls batch-resolve endpoint with resolved status', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      let capturedBody: any = null;
      server.use(
        http.patch('/api/projects/p1/conflicts/batch-resolve', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            success: true,
            data: { count: 5 },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useBatchResolveConflicts());
      result.current.mutate('resolved');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedBody).toEqual({ status: 'resolved' });
    });

    it('calls batch-resolve endpoint with dismissed status', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      let capturedBody: any = null;
      server.use(
        http.patch('/api/projects/p1/conflicts/batch-resolve', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            success: true,
            data: { count: 3 },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useBatchResolveConflicts());
      result.current.mutate('dismissed');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedBody).toEqual({ status: 'dismissed' });
    });
  });

  describe('useAiVerifyConflict', () => {
    it('returns mutate function', () => {
      const { result } = renderHookWithProviders(() => useAiVerifyConflict());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls ai-verify POST endpoint', async () => {
      setMockAuthState({ token: 'tok' });
      let wasCalled = false;
      server.use(
        http.post('/api/conflicts/c-1/ai-verify', () => {
          wasCalled = true;
          return HttpResponse.json({
            success: true,
            data: { id: 'c-1', aiVerified: true },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useAiVerifyConflict());
      result.current.mutate('c-1');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(wasCalled).toBe(true);
    });
  });

  describe('useConflictOverview', () => {
    it('returns mutate function', () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const { result } = renderHookWithProviders(() => useConflictOverview());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls overview-analysis POST endpoint', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      let wasCalled = false;
      server.use(
        http.post('/api/projects/p1/conflicts/overview-analysis', () => {
          wasCalled = true;
          return HttpResponse.json({
            success: true,
            data: { summary: 'All clear', totalConflicts: 0 },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useConflictOverview());
      result.current.mutate();
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(wasCalled).toBe(true);
    });
  });
});
