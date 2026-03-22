import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AutoSetupExistingInput, AutoSetupNewInput } from '@context-sync/shared';
import { supabaseOnboardingApi } from '../api/supabase-onboarding.api';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';

export function useSupabaseProjects(projectId: string | null, enabled: boolean = false) {
  return useQuery({
    queryKey: ['supabase', 'projects', projectId],
    queryFn: () => supabaseOnboardingApi.listProjects(projectId!),
    enabled: !!projectId && enabled,
  });
}

export function useSupabaseOrganizations(projectId: string | null, enabled: boolean = false) {
  return useQuery({
    queryKey: ['supabase', 'organizations', projectId],
    queryFn: () => supabaseOnboardingApi.listOrganizations(projectId!),
    enabled: !!projectId && enabled,
  });
}

export function useSupabaseAutoSetup(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AutoSetupExistingInput) =>
      supabaseOnboardingApi.autoSetup(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['db-config', projectId] });
    },
  });
}

export function useSupabaseCreateAndSetup(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AutoSetupNewInput) =>
      supabaseOnboardingApi.createAndSetup(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['db-config', projectId] });
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
