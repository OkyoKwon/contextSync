import { describe, it, expect } from 'vitest';
import { MODEL_PRICING, DEFAULT_PRICE_PER_MILLION } from '../model-pricing.js';

describe('MODEL_PRICING', () => {
  it('should have all positive prices', () => {
    for (const [model, price] of Object.entries(MODEL_PRICING)) {
      expect(price, `${model} price should be positive`).toBeGreaterThan(0);
    }
  });

  it('should have all values as numbers (no undefined)', () => {
    for (const [model, price] of Object.entries(MODEL_PRICING)) {
      expect(typeof price, `${model} should be a number`).toBe('number');
      expect(Number.isFinite(price), `${model} should be finite`).toBe(true);
    }
  });

  it('should include known models', () => {
    expect(MODEL_PRICING).toHaveProperty('claude-sonnet-4');
    expect(MODEL_PRICING).toHaveProperty('claude-opus-4');
    expect(MODEL_PRICING).toHaveProperty('claude-haiku-4-5');
  });
});

describe('DEFAULT_PRICE_PER_MILLION', () => {
  it('should be defined and positive', () => {
    expect(DEFAULT_PRICE_PER_MILLION).toBeDefined();
    expect(DEFAULT_PRICE_PER_MILLION).toBeGreaterThan(0);
  });

  it('should be a number', () => {
    expect(typeof DEFAULT_PRICE_PER_MILLION).toBe('number');
  });
});
