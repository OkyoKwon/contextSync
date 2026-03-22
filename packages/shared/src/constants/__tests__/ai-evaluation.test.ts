import { describe, it, expect } from 'vitest';
import {
  DIMENSION_WEIGHTS,
  PROFICIENCY_TIER_RANGES,
  EVALUATION_DIMENSIONS,
} from '../ai-evaluation.js';

describe('DIMENSION_WEIGHTS', () => {
  it('should sum to 1.0 within floating point tolerance', () => {
    const sum = Object.values(DIMENSION_WEIGHTS).reduce((acc, val) => acc + val, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('should have all positive values', () => {
    for (const [dimension, weight] of Object.entries(DIMENSION_WEIGHTS)) {
      expect(weight, `${dimension} weight should be positive`).toBeGreaterThan(0);
    }
  });

  it('should have a weight for every evaluation dimension', () => {
    for (const dimension of EVALUATION_DIMENSIONS) {
      expect(DIMENSION_WEIGHTS[dimension], `${dimension} should have a weight`).toBeDefined();
    }
  });
});

describe('PROFICIENCY_TIER_RANGES', () => {
  it('should cover the full 0-100 range', () => {
    expect(PROFICIENCY_TIER_RANGES.novice.min).toBe(0);
    expect(PROFICIENCY_TIER_RANGES.expert.max).toBe(100);
  });

  it('should have no gaps or overlaps between tiers', () => {
    const tiers = ['novice', 'developing', 'proficient', 'advanced', 'expert'] as const;
    for (let i = 1; i < tiers.length; i++) {
      const prevMax = PROFICIENCY_TIER_RANGES[tiers[i - 1]!].max;
      const currMin = PROFICIENCY_TIER_RANGES[tiers[i]!].min;
      expect(currMin, `${tiers[i]} min should be ${tiers[i - 1]} max + 1`).toBe(prevMax + 1);
    }
  });
});
