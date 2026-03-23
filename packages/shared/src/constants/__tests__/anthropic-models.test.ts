import { describe, it, expect } from 'vitest';
import {
  ANTHROPIC_MODELS,
  ANTHROPIC_MODEL_LABELS,
  RECOMMENDED_MODEL,
} from '../anthropic-models.js';

describe('ANTHROPIC_MODELS', () => {
  it('should contain at least one model', () => {
    expect(ANTHROPIC_MODELS.length).toBeGreaterThan(0);
  });

  it('should have unique entries', () => {
    const unique = new Set(ANTHROPIC_MODELS);
    expect(unique.size).toBe(ANTHROPIC_MODELS.length);
  });
});

describe('ANTHROPIC_MODEL_LABELS', () => {
  it('should have a label for every model', () => {
    for (const model of ANTHROPIC_MODELS) {
      expect(ANTHROPIC_MODEL_LABELS[model]).toBeDefined();
      expect(ANTHROPIC_MODEL_LABELS[model].length).toBeGreaterThan(0);
    }
  });
});

describe('RECOMMENDED_MODEL', () => {
  it('should be one of the defined models', () => {
    expect(ANTHROPIC_MODELS).toContain(RECOMMENDED_MODEL);
  });
});
