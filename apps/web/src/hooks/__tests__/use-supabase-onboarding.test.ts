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
  useSupabaseProjects,
  useSupabaseOrganizations,
  useSupabaseAutoSetup,
  useSupabaseCreateAndSetup,
  useSaveSupabaseToken,
  useDeleteSupabaseToken,
} from '../use-supabase-onboarding';

setupMsw();

describe('useSupabaseOnboarding hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
  });

  describe('useSupabaseProjects', () => {
    it('is disabled by default', () => {
      const { result } = renderHookWithProviders(() => useSupabaseProjects());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches projects when enabled', async () => {
      setMockAuthState({ token: 'tok' });
      const projects = [{ id: 'sp-1', name: 'My Supabase Project', region: 'us-east-1' }];
      server.use(
        http.get('/api/supabase/projects', () =>
          HttpResponse.json({ success: true, data: projects, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useSupabaseProjects(true));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toHaveLength(1);
      expect(result.current.data?.data?.[0]!.name).toBe('My Supabase Project');
    });

    it('transitions to error on API failure', async () => {
      setMockAuthState({ token: 'tok' });
      server.use(
        http.get('/api/supabase/projects', () =>
          HttpResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        ),
      );

      const { result } = renderHookWithProviders(() => useSupabaseProjects(true));
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useSupabaseOrganizations', () => {
    it('is disabled by default', () => {
      const { result } = renderHookWithProviders(() => useSupabaseOrganizations());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches organizations when enabled', async () => {
      setMockAuthState({ token: 'tok' });
      const orgs = [{ id: 'org-1', name: 'My Org' }];
      server.use(
        http.get('/api/supabase/organizations', () =>
          HttpResponse.json({ success: true, data: orgs, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useSupabaseOrganizations(true));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toHaveLength(1);
      expect(result.current.data?.data?.[0]!.name).toBe('My Org');
    });
  });

  describe('useSupabaseAutoSetup', () => {
    it('returns mutate function', () => {
      const { result } = renderHookWithProviders(() => useSupabaseAutoSetup());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls auto-setup endpoint', async () => {
      setMockAuthState({ token: 'tok' });
      let capturedBody: any = null;
      server.use(
        http.post('/api/supabase/auto-setup', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            success: true,
            data: { requiresRestart: false, migrationsApplied: ['001'] },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useSupabaseAutoSetup());
      result.current.mutate({ projectRef: 'ref-1', dbPassword: 'pw' } as any);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedBody).toEqual({ projectRef: 'ref-1', dbPassword: 'pw' });
    });
  });

  describe('useSupabaseCreateAndSetup', () => {
    it('returns mutate function', () => {
      const { result } = renderHookWithProviders(() => useSupabaseCreateAndSetup());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls create-and-setup endpoint', async () => {
      setMockAuthState({ token: 'tok' });
      server.use(
        http.post('/api/supabase/create-and-setup', () =>
          HttpResponse.json({
            success: true,
            data: { requiresRestart: true, migrationsApplied: ['001', '002'] },
            error: null,
          }),
        ),
      );

      const { result } = renderHookWithProviders(() => useSupabaseCreateAndSetup());
      result.current.mutate({
        name: 'New Project',
        organizationId: 'org-1',
        dbPassword: 'pw',
        region: 'us-east-1',
      } as any);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data?.requiresRestart).toBe(true);
      expect(result.current.data?.data?.migrationsApplied).toHaveLength(2);
    });
  });

  describe('useSaveSupabaseToken', () => {
    it('returns mutate function', () => {
      setMockAuthState({ token: 'tok' });
      const { result } = renderHookWithProviders(() => useSaveSupabaseToken());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls save supabase token endpoint', async () => {
      setMockAuthState({ token: 'tok' });
      const updatedUser = { id: 'user-1', name: 'Test', email: 'test@test.com' };
      server.use(
        http.put('/api/auth/me/supabase-token', () =>
          HttpResponse.json({ success: true, data: updatedUser, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useSaveSupabaseToken());
      result.current.mutate('sbp_my_supabase_token');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useDeleteSupabaseToken', () => {
    it('returns mutate function', () => {
      setMockAuthState({ token: 'tok' });
      const { result } = renderHookWithProviders(() => useDeleteSupabaseToken());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls delete supabase token endpoint', async () => {
      setMockAuthState({ token: 'tok' });
      const updatedUser = { id: 'user-1', name: 'Test', email: 'test@test.com' };
      server.use(
        http.delete('/api/auth/me/supabase-token', () =>
          HttpResponse.json({ success: true, data: updatedUser, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useDeleteSupabaseToken());
      result.current.mutate();
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});
