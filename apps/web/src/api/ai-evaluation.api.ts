import type {
  AiEvaluation,
  AiEvaluationWithDetails,
  AiEvaluationHistoryEntry,
  TeamEvaluationSummaryEntry,
  TriggerEvaluationInput,
} from '@context-sync/shared';
import { api } from './client';

export const aiEvaluationApi = {
  triggerEvaluation: (projectId: string, input: TriggerEvaluationInput) =>
    api.post<AiEvaluation>(`/projects/${projectId}/ai-evaluation/evaluate`, input),

  getLatestEvaluation: (projectId: string, targetUserId: string) => {
    const params = new URLSearchParams({ targetUserId });
    return api.get<AiEvaluationWithDetails | null>(
      `/projects/${projectId}/ai-evaluation/latest?${params}`,
    );
  },

  getEvaluationHistory: (projectId: string, targetUserId: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      targetUserId,
      page: String(page),
      limit: String(limit),
    });
    return api.get<readonly AiEvaluationHistoryEntry[]>(
      `/projects/${projectId}/ai-evaluation/history?${params}`,
    );
  },

  getEvaluationDetail: (projectId: string, evaluationId: string) =>
    api.get<AiEvaluationWithDetails>(`/projects/${projectId}/ai-evaluation/${evaluationId}`),

  getTeamSummary: (projectId: string) =>
    api.get<readonly TeamEvaluationSummaryEntry[]>(`/projects/${projectId}/ai-evaluation/summary`),
};
