import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();
const mockEnd = vi.fn();

vi.mock('pg', () => {
  const Pool = vi.fn(() => ({
    query: mockQuery,
    end: mockEnd,
  }));
  return { default: { Pool } };
});

import { testConnection } from '../test-connection.js';

describe('testConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnd.mockResolvedValue(undefined);
  });

  it('returns success with version on successful connection', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ version: 'PostgreSQL 16.1' }],
    });

    const result = await testConnection('postgresql://localhost:5432/testdb', false);

    expect(result.success).toBe(true);
    expect(result.version).toBe('PostgreSQL 16.1');
    expect(result.error).toBeNull();
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('returns error message on failed connection', async () => {
    mockQuery.mockRejectedValue(new Error('Connection refused'));

    const result = await testConnection('postgresql://localhost:5432/testdb', false);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Connection refused');
    expect(result.version).toBeNull();
  });

  it('always calls pool.end()', async () => {
    mockQuery.mockResolvedValue({ rows: [{ version: 'PG 16' }] });
    await testConnection('postgresql://localhost:5432/db', false);
    expect(mockEnd).toHaveBeenCalledTimes(1);

    mockEnd.mockClear();
    mockQuery.mockRejectedValue(new Error('fail'));
    await testConnection('postgresql://localhost:5432/db', false);
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('returns Unknown error when non-Error is thrown', async () => {
    mockQuery.mockRejectedValue('string error');

    const result = await testConnection('postgresql://localhost:5432/db', false);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown error');
  });

  it('passes SSL config when sslEnabled is true', async () => {
    const { default: pg } = await import('pg');
    mockQuery.mockResolvedValue({ rows: [{ version: 'PG 16' }] });

    await testConnection('postgresql://localhost:5432/db', true);

    expect(pg.Pool).toHaveBeenCalledWith(
      expect.objectContaining({
        ssl: { rejectUnauthorized: false },
      }),
    );
  });
});
