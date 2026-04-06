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

import { useQuotaStatus, useDetectPlan } from '../use-quota';

setupMsw();

describe('useQuota hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'tok' });
  });

  describe('useQuotaStatus', () => {
    it('fetches quota status successfully', async () => {
      server.use(
        http.get('/api/auth/me/quota', () =>
          HttpResponse.json({
            success: true,
            data: { used: 10, limit: 100, remaining: 90 },
            error: null,
          }),
        ),
      );

      const { result } = renderHookWithProviders(() => useQuotaStatus());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toEqual({ used: 10, limit: 100, remaining: 90 });
    });

    it('handles error response', async () => {
      server.use(
        http.get('/api/auth/me/quota', () =>
          HttpResponse.json({ success: false, data: null, error: 'Unauthorized' }, { status: 401 }),
        ),
      );

      const { result } = renderHookWithProviders(() => useQuotaStatus());
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useDetectPlan', () => {
    it('returns mutate function', () => {
      const { result } = renderHookWithProviders(() => useDetectPlan());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls plan detection endpoint', async () => {
      server.use(
        http.post('/api/auth/me/plan/detect', () =>
          HttpResponse.json({
            success: true,
            data: { plan: 'pro', source: 'api' },
            error: null,
          }),
        ),
      );

      const { result } = renderHookWithProviders(() => useDetectPlan());
      result.current.mutate();
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toEqual({ plan: 'pro', source: 'api' });
    });
  });
});
