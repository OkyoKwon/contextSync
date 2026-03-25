import type { ClaudePlan } from '../constants/claude-plan.js';

export type PlanDetectionSource = 'cli' | 'manual';

export interface QuotaStatus {
  readonly inferredPlan: ClaudePlan;
  readonly detectionSource: PlanDetectionSource;
}
