import type { ClaudePlan } from './claude-plan.js';

/**
 * Heuristic mapping of requests-per-minute limits to Claude plans.
 * These are experiential values — not officially published by Anthropic.
 * Ordered from highest to lowest for greedy matching.
 */
export const PLAN_RATE_LIMIT_THRESHOLDS: readonly {
  readonly minRequestsLimit: number;
  readonly plan: ClaudePlan;
}[] = [
  { minRequestsLimit: 4000, plan: 'enterprise' },
  { minRequestsLimit: 2000, plan: 'max_20x' },
  { minRequestsLimit: 1000, plan: 'max_5x' },
  { minRequestsLimit: 100, plan: 'team' },
  { minRequestsLimit: 50, plan: 'pro' },
  { minRequestsLimit: 0, plan: 'free' },
] as const;

export function inferPlanFromRequestsLimit(requestsLimit: number): ClaudePlan {
  for (const threshold of PLAN_RATE_LIMIT_THRESHOLDS) {
    if (requestsLimit >= threshold.minRequestsLimit) {
      return threshold.plan;
    }
  }
  return 'free';
}
