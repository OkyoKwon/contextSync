import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.api';

export function useGenerateJoinCode(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => projectsApi.generateJoinCode(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useRegenerateJoinCode(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => projectsApi.regenerateJoinCode(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteJoinCode(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => projectsApi.deleteJoinCode(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useJoinProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => projectsApi.joinByCode(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
