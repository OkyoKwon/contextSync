import type { QuotaStatus, ClaudePlan, PlanDetectionSource } from '@context-sync/shared';
import { api } from './client';

export function fetchQuotaStatus() {
  return api.get<QuotaStatus>('/auth/me/quota');
}

export function triggerPlanDetection() {
  return api.post<{ plan: ClaudePlan; source: PlanDetectionSource }>('/auth/me/plan/detect');
}
