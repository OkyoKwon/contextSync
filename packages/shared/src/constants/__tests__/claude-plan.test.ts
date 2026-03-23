import { describe, it, expect } from 'vitest';
import { CLAUDE_PLANS, CLAUDE_PLAN_LABELS } from '../claude-plan.js';

describe('CLAUDE_PLANS', () => {
  it('should contain at least one plan', () => {
    expect(CLAUDE_PLANS.length).toBeGreaterThan(0);
  });

  it('should have unique entries', () => {
    const unique = new Set(CLAUDE_PLANS);
    expect(unique.size).toBe(CLAUDE_PLANS.length);
  });
});

describe('CLAUDE_PLAN_LABELS', () => {
  it('should have a label for every plan', () => {
    for (const plan of CLAUDE_PLANS) {
      expect(CLAUDE_PLAN_LABELS[plan]).toBeDefined();
      expect(CLAUDE_PLAN_LABELS[plan].length).toBeGreaterThan(0);
    }
  });
});
