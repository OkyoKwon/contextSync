import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatTimeAgo,
  shortPath,
  truncate,
  pluralize,
  formatTokenCount,
  formatUSD,
} from '../format';

describe('formatTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns minutes ago for < 60 minutes', () => {
    const tenMinutesAgo = new Date('2025-06-15T11:50:00Z').toISOString();
    expect(formatTimeAgo(tenMinutesAgo)).toBe('10m ago');
  });

  it('returns 0m ago for just now', () => {
    const now = new Date('2025-06-15T12:00:00Z').toISOString();
    expect(formatTimeAgo(now)).toBe('0m ago');
  });

  it('returns hours ago for >= 60 minutes and < 24 hours', () => {
    const threeHoursAgo = new Date('2025-06-15T09:00:00Z').toISOString();
    expect(formatTimeAgo(threeHoursAgo)).toBe('3h ago');
  });

  it('returns days ago for >= 24 hours', () => {
    const twoDaysAgo = new Date('2025-06-13T12:00:00Z').toISOString();
    expect(formatTimeAgo(twoDaysAgo)).toBe('2d ago');
  });
});

describe('shortPath', () => {
  it('returns last 2 segments of a full path', () => {
    expect(shortPath('/home/user/projects/my-app')).toBe('projects/my-app');
  });

  it('returns the path unchanged if it has 2 or fewer segments', () => {
    expect(shortPath('projects/my-app')).toBe('projects/my-app');
  });

  it('handles single segment path', () => {
    expect(shortPath('my-app')).toBe('my-app');
  });
});

describe('truncate', () => {
  it('returns string unchanged when under limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates with ellipsis when over limit', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });

  it('returns string unchanged when exactly at limit', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});

describe('pluralize', () => {
  it('returns singular form for count 1', () => {
    expect(pluralize(1, 'item')).toBe('1 item');
  });

  it('returns plural form for count 0', () => {
    expect(pluralize(0, 'item')).toBe('0 items');
  });

  it('returns plural form for count > 1', () => {
    expect(pluralize(2, 'item')).toBe('2 items');
  });

  it('uses custom plural when provided', () => {
    expect(pluralize(2, 'child', 'children')).toBe('2 children');
  });
});

describe('formatTokenCount', () => {
  it('formats millions with M suffix', () => {
    expect(formatTokenCount(1_500_000)).toBe('1.5M');
  });

  it('formats thousands with K suffix', () => {
    expect(formatTokenCount(2_500)).toBe('2.5K');
  });

  it('formats numbers under 1000 with locale string', () => {
    expect(formatTokenCount(500)).toBe('500');
  });
});

describe('formatUSD', () => {
  it('formats number as USD with 2 decimal places', () => {
    expect(formatUSD(9.5)).toBe('$9.50');
  });

  it('formats zero', () => {
    expect(formatUSD(0)).toBe('$0.00');
  });
});
