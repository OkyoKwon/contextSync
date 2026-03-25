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

import { usePlans, usePlanDetail, useDeletePlan } from '../use-plans';

setupMsw();

describe('usePlans hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'tok' });
  });

  describe('usePlans', () => {
    it('fetches plan list successfully', async () => {
      server.use(
        http.get('/api/plans/local', () =>
          HttpResponse.json({
            success: true,
            data: [{ filename: 'plan.md', title: 'My Plan' }],
            error: null,
          }),
        ),
      );

      const { result } = renderHookWithProviders(() => usePlans());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toEqual([{ filename: 'plan.md', title: 'My Plan' }]);
    });

    it('handles error response', async () => {
      server.use(
        http.get('/api/plans/local', () =>
          HttpResponse.json(
            { success: false, data: null, error: 'Failed to read plans' },
            { status: 500 },
          ),
        ),
      );

      const { result } = renderHookWithProviders(() => usePlans());
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('usePlanDetail', () => {
    it('is disabled when filename is null', () => {
      const { result } = renderHookWithProviders(() => usePlanDetail(null));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches plan detail with filename', async () => {
      server.use(
        http.get('/api/plans/local/plan.md', () =>
          HttpResponse.json({
            success: true,
            data: { filename: 'plan.md', title: 'My Plan', content: '# Plan' },
            error: null,
          }),
        ),
      );

      const { result } = renderHookWithProviders(() => usePlanDetail('plan.md'));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data?.filename).toBe('plan.md');
    });

    it('handles error for non-existent plan', async () => {
      server.use(
        http.get('/api/plans/local/missing.md', () =>
          HttpResponse.json(
            { success: false, data: null, error: 'Plan not found' },
            { status: 404 },
          ),
        ),
      );

      const { result } = renderHookWithProviders(() => usePlanDetail('missing.md'));
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useDeletePlan', () => {
    it('returns mutate function', () => {
      const { result } = renderHookWithProviders(() => useDeletePlan());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls DELETE /plans/local/:filename on mutate', async () => {
      server.use(
        http.delete('/api/plans/local/plan.md', () =>
          HttpResponse.json({ success: true, data: null, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useDeletePlan());
      result.current.mutate('plan.md');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});
