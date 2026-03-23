import { describe, it, expect } from 'vitest';
import {
  PLAN_RATE_LIMIT_THRESHOLDS,
  inferPlanFromRequestsLimit,
} from '../rate-limit-thresholds.js';

describe('PLAN_RATE_LIMIT_THRESHOLDS', () => {
  it('should be sorted by minRequestsLimit in descending order', () => {
    for (let i = 1; i < PLAN_RATE_LIMIT_THRESHOLDS.length; i++) {
      expect(PLAN_RATE_LIMIT_THRESHOLDS[i - 1]!.minRequestsLimit).toBeGreaterThan(
        PLAN_RATE_LIMIT_THRESHOLDS[i]!.minRequestsLimit,
      );
    }
  });

  it('should include a zero threshold as the fallback', () => {
    const last = PLAN_RATE_LIMIT_THRESHOLDS[PLAN_RATE_LIMIT_THRESHOLDS.length - 1];
    expect(last!.minRequestsLimit).toBe(0);
  });
});

describe('inferPlanFromRequestsLimit', () => {
  it('should return enterprise for very high limits', () => {
    expect(inferPlanFromRequestsLimit(5000)).toBe('enterprise');
  });

  it('should return max_20x for limits >= 2000', () => {
    expect(inferPlanFromRequestsLimit(2000)).toBe('max_20x');
  });

  it('should return max_5x for limits >= 1000', () => {
    expect(inferPlanFromRequestsLimit(1000)).toBe('max_5x');
  });

  it('should return pro for limits >= 50', () => {
    expect(inferPlanFromRequestsLimit(50)).toBe('pro');
  });

  it('should return free for zero', () => {
    expect(inferPlanFromRequestsLimit(0)).toBe('free');
  });
});
