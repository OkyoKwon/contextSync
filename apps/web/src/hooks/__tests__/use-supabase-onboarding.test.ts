import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../api/supabase-onboarding.api', () => ({
  supabaseOnboardingApi: {
    listProjects: vi.fn(),
    listOrganizations: vi.fn(),
    autoSetup: vi.fn(),
    createAndSetup: vi.fn(),
  },
}));

vi.mock('../../api/auth.api', () => ({
  authApi: {
    saveSupabaseToken: vi.fn(),
    deleteSupabaseToken: vi.fn(),
  },
}));

import { useAuthStore } from '../../stores/auth.store';
import {
  useSupabaseProjects,
  useSupabaseOrganizations,
  useSupabaseAutoSetup,
  useSupabaseCreateAndSetup,
  useSaveSupabaseToken,
  useDeleteSupabaseToken,
} from '../use-supabase-onboarding';

describe('useSupabaseOnboarding hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useSupabaseProjects is disabled by default', () => {
    const { result } = renderHookWithProviders(() => useSupabaseProjects());
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useSupabaseOrganizations is disabled by default', () => {
    const { result } = renderHookWithProviders(() => useSupabaseOrganizations());
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useSupabaseAutoSetup returns mutate', () => {
    const { result } = renderHookWithProviders(() => useSupabaseAutoSetup());
    expect(result.current.mutate).toBeDefined();
  });

  it('useSupabaseCreateAndSetup returns mutate', () => {
    const { result } = renderHookWithProviders(() => useSupabaseCreateAndSetup());
    expect(result.current.mutate).toBeDefined();
  });

  it('useSaveSupabaseToken returns mutate', () => {
    vi.mocked(useAuthStore).mockImplementation((s: any) => s({ setAuth: vi.fn(), token: 'tok' }));
    const { result } = renderHookWithProviders(() => useSaveSupabaseToken());
    expect(result.current.mutate).toBeDefined();
  });

  it('useDeleteSupabaseToken returns mutate', () => {
    vi.mocked(useAuthStore).mockImplementation((s: any) => s({ setAuth: vi.fn(), token: 'tok' }));
    const { result } = renderHookWithProviders(() => useDeleteSupabaseToken());
    expect(result.current.mutate).toBeDefined();
  });
});
