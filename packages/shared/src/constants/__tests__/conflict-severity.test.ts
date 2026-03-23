import { describe, it, expect } from 'vitest';
import {
  CONFLICT_TYPES,
  CONFLICT_SEVERITIES,
  CONFLICT_STATUSES,
  SEVERITY_THRESHOLDS,
  CONFLICT_DETECTION_WINDOW_DAYS,
} from '../conflict-severity.js';

describe('CONFLICT_TYPES', () => {
  it('should contain expected types', () => {
    expect(CONFLICT_TYPES).toContain('file');
    expect(CONFLICT_TYPES).toContain('design');
    expect(CONFLICT_TYPES).toContain('dependency');
    expect(CONFLICT_TYPES).toContain('plan');
  });
});

describe('CONFLICT_SEVERITIES', () => {
  it('should contain all severity levels', () => {
    expect(CONFLICT_SEVERITIES).toContain('info');
    expect(CONFLICT_SEVERITIES).toContain('warning');
    expect(CONFLICT_SEVERITIES).toContain('critical');
  });
});

describe('CONFLICT_STATUSES', () => {
  it('should contain all status values', () => {
    expect(CONFLICT_STATUSES).toContain('detected');
    expect(CONFLICT_STATUSES).toContain('reviewing');
    expect(CONFLICT_STATUSES).toContain('resolved');
    expect(CONFLICT_STATUSES).toContain('dismissed');
  });
});

describe('SEVERITY_THRESHOLDS', () => {
  it('should have thresholds for every severity', () => {
    for (const severity of CONFLICT_SEVERITIES) {
      expect(SEVERITY_THRESHOLDS[severity]).toBeDefined();
      expect(SEVERITY_THRESHOLDS[severity].minOverlap).toBeDefined();
      expect(SEVERITY_THRESHOLDS[severity].maxOverlap).toBeDefined();
    }
  });

  it('should have non-overlapping ranges in ascending order', () => {
    expect(SEVERITY_THRESHOLDS.info.maxOverlap).toBeLessThan(
      SEVERITY_THRESHOLDS.warning.minOverlap,
    );
    expect(SEVERITY_THRESHOLDS.warning.maxOverlap).toBeLessThan(
      SEVERITY_THRESHOLDS.critical.minOverlap,
    );
  });
});

describe('CONFLICT_DETECTION_WINDOW_DAYS', () => {
  it('should be a positive number', () => {
    expect(CONFLICT_DETECTION_WINDOW_DAYS).toBeGreaterThan(0);
  });
});
