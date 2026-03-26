import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiEvaluationApi } from '../api/ai-evaluation.api';
import { useAuthStore } from '../stores/auth.store';
import type { TriggerEvaluationInput } from '@context-sync/shared';

export function useTeamEvaluationSummary() {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['ai-evaluation-summary', projectId],
    queryFn: () => aiEvaluationApi.getTeamSummary(projectId!),
    enabled: !!projectId && projectId !== 'skipped',
  });
}

export function useStartEvaluation() {
  const projectId = useAuthStore((s) => s.currentProjectId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TriggerEvaluationInput) =>
      aiEvaluationApi.triggerEvaluation(projectId!, input),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['ai-evaluation-summary', projectId] });
      queryClient.refetchQueries({ queryKey: ['ai-evaluation-latest'] });
      queryClient.refetchQueries({ queryKey: ['ai-evaluation-history'] });
    },
  });
}

export function useLatestEvaluation(targetUserId: string | null) {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['ai-evaluation-latest', projectId, targetUserId],
    queryFn: () => aiEvaluationApi.getLatestEvaluation(projectId!, targetUserId!),
    enabled: !!projectId && projectId !== 'skipped' && !!targetUserId,
  });
}

export function useEvaluationDetail(evaluationId: string | null) {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['ai-evaluation-detail', projectId, evaluationId],
    queryFn: () => aiEvaluationApi.getEvaluationDetail(projectId!, evaluationId!),
    enabled: !!projectId && projectId !== 'skipped' && !!evaluationId,
  });
}

export function useEvaluationHistory(targetUserId: string | null, page = 1) {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['ai-evaluation-history', projectId, targetUserId, page],
    queryFn: () => aiEvaluationApi.getEvaluationHistory(projectId!, targetUserId!, page),
    enabled: !!projectId && projectId !== 'skipped' && !!targetUserId,
    refetchInterval: (query) => {
      const entries = query.state.data?.data;
      const hasInProgress = entries?.some(
        (e) => e.status === 'pending' || e.status === 'analyzing',
      );
      return hasInProgress ? 3000 : false;
    },
  });
}
