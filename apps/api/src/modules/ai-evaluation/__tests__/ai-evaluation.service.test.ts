import { describe, it, expect } from 'vitest';
import { DIMENSION_WEIGHTS, PROFICIENCY_TIER_RANGES } from '@context-sync/shared';
import type { EvaluationDimension, ProficiencyTier } from '@context-sync/shared';

// Test the pure calculation functions by replicating them
// (since they're not exported from the service, we test the logic directly)

function calculateOverallScore(scores: Record<EvaluationDimension, number>): number {
  let total = 0;
  for (const [dimension, weight] of Object.entries(DIMENSION_WEIGHTS)) {
    total += (scores[dimension as EvaluationDimension] ?? 0) * weight;
  }
  return Math.round(total * 100) / 100;
}

function determineProficiencyTier(score: number): ProficiencyTier {
  for (const [tier, range] of Object.entries(PROFICIENCY_TIER_RANGES)) {
    if (score >= range.min && score <= range.max) {
      return tier as ProficiencyTier;
    }
  }
  return 'novice';
}

describe('calculateOverallScore', () => {
  it('calculates weighted average correctly', () => {
    const scores: Record<EvaluationDimension, number> = {
      prompt_quality: 80,
      task_complexity: 70,
      iteration_pattern: 60,
      context_utilization: 50,
      ai_capability_leverage: 40,
    };

    // 80*0.25 + 70*0.20 + 60*0.20 + 50*0.20 + 40*0.15
    // = 20 + 14 + 12 + 10 + 6 = 62
    const result = calculateOverallScore(scores);
    expect(result).toBe(62);
  });

  it('returns 0 for all-zero scores', () => {
    const scores: Record<EvaluationDimension, number> = {
      prompt_quality: 0,
      task_complexity: 0,
      iteration_pattern: 0,
      context_utilization: 0,
      ai_capability_leverage: 0,
    };
    expect(calculateOverallScore(scores)).toBe(0);
  });

  it('returns 100 for all-perfect scores', () => {
    const scores: Record<EvaluationDimension, number> = {
      prompt_quality: 100,
      task_complexity: 100,
      iteration_pattern: 100,
      context_utilization: 100,
      ai_capability_leverage: 100,
    };
    expect(calculateOverallScore(scores)).toBe(100);
  });

  it('weights sum to 1.0', () => {
    const totalWeight = Object.values(DIMENSION_WEIGHTS).reduce((sum, w) => sum + w, 0);
    expect(totalWeight).toBeCloseTo(1.0);
  });
});

describe('determineProficiencyTier', () => {
  it('returns novice for scores 0-25', () => {
    expect(determineProficiencyTier(0)).toBe('novice');
    expect(determineProficiencyTier(25)).toBe('novice');
  });

  it('returns developing for scores 26-50', () => {
    expect(determineProficiencyTier(26)).toBe('developing');
    expect(determineProficiencyTier(50)).toBe('developing');
  });

  it('returns proficient for scores 51-70', () => {
    expect(determineProficiencyTier(51)).toBe('proficient');
    expect(determineProficiencyTier(70)).toBe('proficient');
  });

  it('returns advanced for scores 71-85', () => {
    expect(determineProficiencyTier(71)).toBe('advanced');
    expect(determineProficiencyTier(85)).toBe('advanced');
  });

  it('returns expert for scores 86-100', () => {
    expect(determineProficiencyTier(86)).toBe('expert');
    expect(determineProficiencyTier(100)).toBe('expert');
  });
});
