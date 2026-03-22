import { describe, it, expect } from 'vitest';
import {
  computeChartPoints,
  buildSmoothPath,
  buildAreaPath,
  computeDeltas,
  formatChartDate,
} from '../prd-chart-utils';
import type { ChartPoint } from '../prd-chart-utils';
import type { PrdAnalysisHistoryEntry } from '@context-sync/shared';

const makeDimensions = () => ({
  width: 400,
  height: 200,
  padding: { top: 10, right: 10, bottom: 10, left: 10 },
});

const makeEntry = (overrides: Partial<PrdAnalysisHistoryEntry> = {}): PrdAnalysisHistoryEntry => ({
  id: '1',
  prdDocumentId: 'doc1',
  documentTitle: 'Test',
  status: 'completed',
  overallRate: 80,
  totalItems: 10,
  achievedItems: 8,
  partialItems: 1,
  notStartedItems: 1,
  modelUsed: 'claude',
  createdAt: '2025-06-15T12:00:00Z',
  completedAt: '2025-06-15T12:01:00Z',
  ...overrides,
});

describe('computeChartPoints', () => {
  it('returns empty array for empty entries', () => {
    expect(computeChartPoints([], makeDimensions())).toEqual([]);
  });

  it('returns correct coordinates for entries', () => {
    const entries = [
      makeEntry({ id: '2', overallRate: 60, createdAt: '2025-06-14T12:00:00Z' }),
      makeEntry({ id: '1', overallRate: 80, createdAt: '2025-06-15T12:00:00Z' }),
    ];
    const points = computeChartPoints(entries, makeDimensions());
    expect(points).toHaveLength(2);
    expect(points[0]!.rate).toBe(80);
    expect(points[1]!.rate).toBe(60);
  });

  it('filters non-completed entries', () => {
    const entries = [
      makeEntry({ status: 'pending' }),
      makeEntry({ id: '2', status: 'completed', overallRate: 50 }),
    ];
    const points = computeChartPoints(entries, makeDimensions());
    expect(points).toHaveLength(1);
    expect(points[0]!.rate).toBe(50);
  });

  it('centers x for single entry', () => {
    const entries = [makeEntry()];
    const dims = makeDimensions();
    const points = computeChartPoints(entries, dims);
    expect(points).toHaveLength(1);
    const expectedX = dims.padding.left + (dims.width - dims.padding.left - dims.padding.right) / 2;
    expect(points[0]!.x).toBe(expectedX);
  });
});

describe('buildSmoothPath', () => {
  it('returns empty string for no points', () => {
    expect(buildSmoothPath([])).toBe('');
  });

  it('returns M x y for single point', () => {
    const points: readonly ChartPoint[] = [{ x: 10, y: 20, rate: 50, date: '2025-01-01' }];
    expect(buildSmoothPath(points)).toBe('M 10 20');
  });

  it('returns path starting with M for multiple points', () => {
    const points: readonly ChartPoint[] = [
      { x: 10, y: 20, rate: 50, date: '2025-01-01' },
      { x: 30, y: 40, rate: 60, date: '2025-01-02' },
      { x: 50, y: 10, rate: 70, date: '2025-01-03' },
    ];
    const path = buildSmoothPath(points);
    expect(path).toMatch(/^M /);
    expect(path).toContain('Q');
  });
});

describe('buildAreaPath', () => {
  it('returns empty string for fewer than 2 points', () => {
    const points: readonly ChartPoint[] = [{ x: 10, y: 20, rate: 50, date: '2025-01-01' }];
    expect(buildAreaPath(points, 100)).toBe('');
  });

  it('returns path ending with Z for multiple points', () => {
    const points: readonly ChartPoint[] = [
      { x: 10, y: 20, rate: 50, date: '2025-01-01' },
      { x: 30, y: 40, rate: 60, date: '2025-01-02' },
    ];
    const path = buildAreaPath(points, 100);
    expect(path).toMatch(/Z$/);
  });
});

describe('computeDeltas', () => {
  it('returns null for first entry', () => {
    const entries = [makeEntry()];
    const deltas = computeDeltas(entries);
    expect(deltas[0]).toBeNull();
  });

  it('calculates differences between consecutive entries', () => {
    const entries = [
      makeEntry({ id: '2', overallRate: 60, createdAt: '2025-06-14T12:00:00Z' }),
      makeEntry({ id: '1', overallRate: 80, createdAt: '2025-06-15T12:00:00Z' }),
    ];
    const deltas = computeDeltas(entries);
    expect(deltas).toHaveLength(2);
    expect(deltas[0]).toBeNull();
    expect(deltas[1]).toBe(-20);
  });
});

describe('formatChartDate', () => {
  it('formats date to short month and day', () => {
    const result = formatChartDate('2025-06-15T12:00:00Z');
    expect(result).toContain('15');
  });
});
