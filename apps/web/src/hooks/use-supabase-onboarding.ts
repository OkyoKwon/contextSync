import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AutoSetupExistingInput, AutoSetupNewInput } from '@context-sync/shared';
import { supabaseOnboardingApi } from '../api/supabase-onboarding.api';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';

export function useSupabaseProjects(enabled: boolean = false) {
  return useQuery({
    queryKey: ['supabase', 'projects'],
    queryFn: () => supabaseOnboardingApi.listProjects(),
    enabled,
  });
}

export function useSupabaseOrganizations(enabled: boolean = false) {
  return useQuery({
    queryKey: ['supabase', 'organizations'],
    queryFn: () => supabaseOnboardingApi.listOrganizations(),
    enabled,
  });
}

export function useSupabaseAutoSetup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AutoSetupExistingInput) => supabaseOnboardingApi.autoSetup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useSupabaseCreateAndSetup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AutoSetupNewInput) => supabaseOnboardingApi.createAndSetup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useSaveSupabaseToken() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  return useMutation({
    mutationFn: (supabaseToken: string) => authApi.saveSupabaseToken(supabaseToken),
    onSuccess: (response) => {
      if (response.data && token) {
        setAuth(token, response.data);
      }
    },
  });
}

export function useDeleteSupabaseToken() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  return useMutation({
    mutationFn: () => authApi.deleteSupabaseToken(),
    onSuccess: (response) => {
      if (response.data && token) {
        setAuth(token, response.data);
      }
    },
  });
}
