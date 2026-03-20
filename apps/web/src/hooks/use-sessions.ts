import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SessionFilterQuery, TokenUsagePeriod } from '@context-sync/shared';
import { sessionsApi } from '../api/sessions.api';
import { useAuthStore } from '../stores/auth.store';

export function useSessions(filter?: SessionFilterQuery) {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['sessions', projectId, filter],
    queryFn: () => sessionsApi.list(projectId!, filter),
    enabled: !!projectId && projectId !== 'skipped',
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionsApi.get(sessionId),
    enabled: !!sessionId,
  });
}

export function useImportSession() {
  const queryClient = useQueryClient();
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useMutation({
    mutationFn: (file: File) => sessionsApi.import(projectId!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['token-usage'] });
    },
  });
}

export function useTimeline(filter?: SessionFilterQuery) {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['timeline', projectId, filter],
    queryFn: () => sessionsApi.timeline(projectId!, filter),
    enabled: !!projectId && projectId !== 'skipped',
  });
}

export function useTokenUsage(period: TokenUsagePeriod = '30d') {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['token-usage', projectId, period],
    queryFn: () => sessionsApi.tokenUsage(projectId!, period),
    enabled: !!projectId && projectId !== 'skipped',
  });
}

export function useRecalculateTokens() {
  const queryClient = useQueryClient();
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useMutation({
    mutationFn: () => sessionsApi.recalculateTokens(projectId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['token-usage'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDashboardStats() {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['stats', projectId],
    queryFn: () => sessionsApi.stats(projectId!),
    enabled: !!projectId && projectId !== 'skipped',
  });
}

export function useTeamStats() {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['team-stats', projectId],
    queryFn: () => sessionsApi.teamStats(projectId!),
    enabled: !!projectId && projectId !== 'skipped',
  });
}
