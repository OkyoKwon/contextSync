import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConflictFilterQuery, UpdateConflictInput } from '@context-sync/shared';
import { conflictsApi } from '../api/conflicts.api';
import { useAuthStore } from '../stores/auth.store';

export function useConflicts(filter?: ConflictFilterQuery) {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['conflicts', projectId, filter],
    queryFn: () => conflictsApi.list(projectId!, filter),
    enabled: !!projectId,
  });
}

export function useConflict(conflictId: string) {
  return useQuery({
    queryKey: ['conflict', conflictId],
    queryFn: () => conflictsApi.get(conflictId),
    enabled: !!conflictId,
  });
}

export function useUpdateConflict() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateConflictInput }) =>
      conflictsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
