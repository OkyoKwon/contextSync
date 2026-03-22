import { describe, it, expect } from 'vitest';
import { periodToDays, normalizeModelName, estimateCost } from '../token-usage.helpers.js';

describe('periodToDays', () => {
  it('returns 7 for "7d"', () => {
    expect(periodToDays('7d')).toBe(7);
  });

  it('returns 30 for "30d"', () => {
    expect(periodToDays('30d')).toBe(30);
  });

  it('returns 90 for "90d"', () => {
    expect(periodToDays('90d')).toBe(90);
  });
});

describe('normalizeModelName', () => {
  it('strips date suffix from model name', () => {
    expect(normalizeModelName('claude-sonnet-4-20250514')).toBe('claude-sonnet-4');
  });

  it('keeps name without date suffix unchanged', () => {
    expect(normalizeModelName('claude-sonnet-4')).toBe('claude-sonnet-4');
  });
});

describe('estimateCost', () => {
  it('uses model-specific pricing for known model', () => {
    // claude-haiku-4-5 costs 2.0 per million tokens
    const cost = estimateCost(1_000_000, 'claude-haiku-4-5');
    expect(cost).toBe(2.0);
  });

  it('uses default pricing for unknown model', () => {
    // DEFAULT_PRICE_PER_MILLION is 9.0
    const cost = estimateCost(1_000_000, 'unknown-model');
    expect(cost).toBe(9.0);
  });

  it('returns 0 for 0 tokens', () => {
    expect(estimateCost(0, 'claude-sonnet-4')).toBe(0);
  });
});
