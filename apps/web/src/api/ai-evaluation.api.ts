import type {
  AiEvaluationWithDetails,
  AiEvaluationHistoryEntry,
  TeamEvaluationSummaryEntry,
  TriggerEvaluationInput,
  TriggerEvaluationGroupResult,
  EvaluationGroupResult,
  EvaluationGroupHistoryEntry,
  LearningGuide,
} from '@context-sync/shared';
import { api } from './client';

export const aiEvaluationApi = {
  triggerEvaluation: (projectId: string, input: TriggerEvaluationInput) =>
    api.post<TriggerEvaluationGroupResult>(`/projects/${projectId}/ai-evaluation/evaluate`, input),

  getLatestEvaluationGroup: (projectId: string, targetUserId: string) => {
    const params = new URLSearchParams({ targetUserId });
    return api.get<EvaluationGroupResult | null>(
      `/projects/${projectId}/ai-evaluation/latest-group?${params}`,
    );
  },

  getEvaluationGroup: (projectId: string, groupId: string) =>
    api.get<EvaluationGroupResult | null>(`/projects/${projectId}/ai-evaluation/group/${groupId}`),

  getEvaluationGroupHistory: (projectId: string, targetUserId: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      targetUserId,
      page: String(page),
      limit: String(limit),
    });
    return api.get<readonly EvaluationGroupHistoryEntry[]>(
      `/projects/${projectId}/ai-evaluation/group-history?${params}`,
    );
  },

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

  backfillTranslations: (projectId: string, limit = 10) =>
    api.post<{ processed: number; failed: number }>(
      `/projects/${projectId}/ai-evaluation/backfill-translations`,
      { limit },
    ),

  getLearningGuide: (projectId: string, groupId: string) =>
    api.get<LearningGuide | null>(
      `/projects/${projectId}/ai-evaluation/group/${groupId}/learning-guide`,
    ),

  regenerateLearningGuide: (projectId: string, groupId: string) =>
    api.post<LearningGuide | null>(
      `/projects/${projectId}/ai-evaluation/group/${groupId}/learning-guide/regenerate`,
    ),

  deleteEvaluationGroup: (projectId: string, groupId: string) =>
    api.delete<{ deleted: boolean }>(`/projects/${projectId}/ai-evaluation/group/${groupId}`),
};
