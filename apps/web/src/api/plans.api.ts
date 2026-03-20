import type { PlanSummary, PlanDetail } from '@context-sync/shared';
import { api } from './client';

export const plansApi = {
  list: () => api.get<readonly PlanSummary[]>('/plans/local'),
  get: (filename: string) => api.get<PlanDetail>(`/plans/local/${encodeURIComponent(filename)}`),
  delete: (filename: string) => api.delete<void>(`/plans/local/${encodeURIComponent(filename)}`),
};
