import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConflictFilterQuery, UpdateConflictInput } from '@context-sync/shared';
import { conflictsApi } from '../api/conflicts.api';
import { useAuthStore } from '../stores/auth.store';

interface UseConflictsOptions {
  readonly enabled?: boolean;
}

export function useConflicts(filter?: ConflictFilterQuery, options?: UseConflictsOptions) {
  const projectId = useAuthStore((s) => s.currentProjectId);
  const enabledByDefault = !!projectId && projectId !== 'skipped';
  const enabled =
    options?.enabled !== undefined ? enabledByDefault && options.enabled : enabledByDefault;

  return useQuery({
    queryKey: ['conflicts', projectId, filter],
    queryFn: () => conflictsApi.list(projectId!, filter),
    enabled,
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

export function useAssignReviewer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conflictId, reviewerId }: { conflictId: string; reviewerId: string }) =>
      conflictsApi.assignReviewer(conflictId, reviewerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['conflict'] });
    },
  });
}

export function useAddReviewNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conflictId, reviewNotes }: { conflictId: string; reviewNotes: string }) =>
      conflictsApi.addReviewNotes(conflictId, reviewNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['conflict'] });
    },
  });
}
