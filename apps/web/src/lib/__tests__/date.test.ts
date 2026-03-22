import { describe, it, expect } from 'vitest';
import { timeAgo, formatDate, getGreeting } from '../date';

describe('getGreeting', () => {
  it('returns Good morning for hour 8', () => {
    expect(getGreeting(8)).toBe('Good morning');
  });

  it('returns Good afternoon for hour 14', () => {
    expect(getGreeting(14)).toBe('Good afternoon');
  });

  it('returns Good evening for hour 20', () => {
    expect(getGreeting(20)).toBe('Good evening');
  });

  it('returns Good morning at boundary hour 0', () => {
    expect(getGreeting(0)).toBe('Good morning');
  });

  it('returns Good afternoon at boundary hour 12', () => {
    expect(getGreeting(12)).toBe('Good afternoon');
  });

  it('returns Good evening at boundary hour 18', () => {
    expect(getGreeting(18)).toBe('Good evening');
  });
});

describe('formatDate', () => {
  it('formats date string to yyyy-MM-dd HH:mm', () => {
    expect(formatDate('2025-06-15T14:30:00Z')).toMatch(/2025-06-1\d \d{2}:\d{2}/);
  });
});

describe('timeAgo', () => {
  it('returns a string containing "ago"', () => {
    const pastDate = new Date(Date.now() - 60_000 * 5).toISOString();
    expect(timeAgo(pastDate)).toContain('ago');
  });
});
