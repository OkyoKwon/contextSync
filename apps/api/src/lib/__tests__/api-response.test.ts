import { describe, it, expect } from 'vitest';

import { ok, fail, paginated, buildPaginationMeta } from '../api-response.js';

describe('ok', () => {
  it('returns success response with data', () => {
    const result = ok('hello');
    expect(result).toEqual({ success: true, data: 'hello', error: null });
  });

  it('handles null data', () => {
    const result = ok(null);
    expect(result).toEqual({ success: true, data: null, error: null });
  });

  it('handles array data', () => {
    const data = [1, 2, 3];
    const result = ok(data);
    expect(result).toEqual({ success: true, data: [1, 2, 3], error: null });
  });

  it('handles object data', () => {
    const data = { id: 1, name: 'test' };
    const result = ok(data);
    expect(result).toEqual({ success: true, data: { id: 1, name: 'test' }, error: null });
  });
});

describe('fail', () => {
  it('returns failure response with error message', () => {
    const result = fail('Something went wrong');
    expect(result).toEqual({ success: false, data: null, error: 'Something went wrong' });
  });

  it('handles empty string error', () => {
    const result = fail('');
    expect(result).toEqual({ success: false, data: null, error: '' });
  });
});

describe('paginated', () => {
  it('returns success response with data and meta', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const meta = { total: 50, page: 1, limit: 10, totalPages: 5 };
    const result = paginated(data, meta);
    expect(result).toEqual({
      success: true,
      data: [{ id: 1 }, { id: 2 }],
      error: null,
      meta: { total: 50, page: 1, limit: 10, totalPages: 5 },
    });
  });
});

describe('buildPaginationMeta', () => {
  it('calculates totalPages with exact division', () => {
    const result = buildPaginationMeta(100, 1, 10);
    expect(result).toEqual({ total: 100, page: 1, limit: 10, totalPages: 10 });
  });

  it('rounds up totalPages when there is a remainder', () => {
    const result = buildPaginationMeta(101, 1, 10);
    expect(result).toEqual({ total: 101, page: 1, limit: 10, totalPages: 11 });
  });

  it('returns 0 totalPages when total is 0', () => {
    const result = buildPaginationMeta(0, 1, 10);
    expect(result).toEqual({ total: 0, page: 1, limit: 10, totalPages: 0 });
  });

  it('returns 1 page when limit is larger than total', () => {
    const result = buildPaginationMeta(5, 1, 20);
    expect(result).toEqual({ total: 5, page: 1, limit: 20, totalPages: 1 });
  });

  it('preserves page and limit values', () => {
    const result = buildPaginationMeta(200, 3, 25);
    expect(result.page).toBe(3);
    expect(result.limit).toBe(25);
  });
});
