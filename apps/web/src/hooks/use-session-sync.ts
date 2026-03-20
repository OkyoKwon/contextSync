import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../api/sessions.api';
import { useAuthStore } from '../stores/auth.store';

export function useLocalSessions(activeOnly = true) {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['local-sessions', projectId, activeOnly],
    queryFn: () => sessionsApi.listLocal(projectId!, activeOnly),
    enabled: !!projectId && projectId !== 'skipped',
  });
}

export function useSyncSessions() {
  const queryClient = useQueryClient();
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useMutation({
    mutationFn: (sessionIds: readonly string[]) => sessionsApi.sync(projectId!, sessionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['local-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
