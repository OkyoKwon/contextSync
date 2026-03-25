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

import { useAdminStatus, useAdminConfig, useRunMigrations } from '../use-admin';

setupMsw();

describe('useAdmin hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'tok' });
  });

  describe('useAdminStatus', () => {
    it('fetches admin status successfully', async () => {
      server.use(
        http.get('/api/admin/status', () =>
          HttpResponse.json({
            success: true,
            data: { migrationsPending: 0, version: '1.0.0' },
            error: null,
          }),
        ),
      );

      const { result } = renderHookWithProviders(() => useAdminStatus());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toEqual({ migrationsPending: 0, version: '1.0.0' });
    });

    it('handles error response', async () => {
      server.use(
        http.get('/api/admin/status', () =>
          HttpResponse.json(
            { success: false, data: null, error: 'Admin access required' },
            { status: 403 },
          ),
        ),
      );

      const { result } = renderHookWithProviders(() => useAdminStatus());
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useAdminConfig', () => {
    it('fetches admin config successfully', async () => {
      server.use(
        http.get('/api/admin/config', () =>
          HttpResponse.json({
            success: true,
            data: { autoSync: true, syncInterval: 30000 },
            error: null,
          }),
        ),
      );

      const { result } = renderHookWithProviders(() => useAdminConfig());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toEqual({ autoSync: true, syncInterval: 30000 });
    });

    it('handles error response', async () => {
      server.use(
        http.get('/api/admin/config', () =>
          HttpResponse.json({ success: false, data: null, error: 'Server error' }, { status: 500 }),
        ),
      );

      const { result } = renderHookWithProviders(() => useAdminConfig());
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useRunMigrations', () => {
    it('returns mutate function', () => {
      const { result } = renderHookWithProviders(() => useRunMigrations());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls POST /admin/migrations/run on mutate', async () => {
      server.use(
        http.post('/api/admin/migrations/run', () =>
          HttpResponse.json({
            success: true,
            data: { applied: ['001_init'] },
            error: null,
          }),
        ),
      );

      const { result } = renderHookWithProviders(() => useRunMigrations());
      result.current.mutate();
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toEqual({ applied: ['001_init'] });
    });
  });
});
