import type { Conflict, ConflictFilterQuery, UpdateConflictInput } from '@context-sync/shared';
import { api } from './client';

export const conflictsApi = {
  list: (projectId: string, filter?: ConflictFilterQuery) => {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([k, v]) => {
        if (v !== undefined) params.set(k, String(v));
      });
    }
    const qs = params.toString();
    return api.get<readonly Conflict[]>(`/projects/${projectId}/conflicts${qs ? `?${qs}` : ''}`);
  },

  get: (conflictId: string) => api.get<Conflict>(`/conflicts/${conflictId}`),

  update: (conflictId: string, input: UpdateConflictInput) =>
    api.patch<Conflict>(`/conflicts/${conflictId}`, input),

  assignReviewer: (conflictId: string, reviewerId: string) =>
    api.patch<Conflict>(`/conflicts/${conflictId}/assign`, { reviewerId }),

  addReviewNotes: (conflictId: string, reviewNotes: string) =>
    api.patch<Conflict>(`/conflicts/${conflictId}/review-notes`, { reviewNotes }),

  batchResolve: (projectId: string, status: 'resolved' | 'dismissed') =>
    api.patch<{ count: number }>(`/projects/${projectId}/conflicts/batch-resolve`, { status }),

  aiVerify: (conflictId: string) => api.post<Conflict>(`/conflicts/${conflictId}/ai-verify`),
};
