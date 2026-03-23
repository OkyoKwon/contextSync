import type { ClaudePlan } from '../constants/claude-plan.js';

export type PlanDetectionSource = 'rate-limit' | 'cli' | 'manual';

export interface RateLimitSnapshot {
  readonly requestsLimit: number | null;
  readonly requestsRemaining: number | null;
  readonly requestsReset: string | null;
  readonly tokensLimit: number | null;
  readonly tokensRemaining: number | null;
  readonly tokensReset: string | null;
  readonly inputTokensLimit: number | null;
  readonly inputTokensRemaining: number | null;
  readonly inputTokensReset: string | null;
  readonly outputTokensLimit: number | null;
  readonly outputTokensRemaining: number | null;
  readonly outputTokensReset: string | null;
  readonly capturedAt: string;
}

export interface QuotaStatus {
  readonly snapshot: RateLimitSnapshot | null;
  readonly inferredPlan: ClaudePlan;
  readonly detectionSource: PlanDetectionSource;
  readonly snapshotAge: number | null;
}
