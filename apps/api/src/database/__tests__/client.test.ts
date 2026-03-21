import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('pg', () => {
  const Pool = vi.fn();
  return { default: { Pool } };
});

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(() => 'mock-ca-cert-content'),
}));

import pg from 'pg';
import { readFileSync } from 'node:fs';
import { createDb } from '../client.js';

const MockPool = vi.mocked(pg.Pool);

describe('createDb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create pool without SSL when ssl is false', () => {
    createDb({ connectionString: 'postgresql://localhost/test' });

    expect(MockPool).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: 'postgresql://localhost/test',
        ssl: false,
      }),
    );
  });

  it('should create pool without SSL when ssl is undefined', () => {
    createDb({ connectionString: 'postgresql://localhost/test' });

    expect(MockPool).toHaveBeenCalledWith(
      expect.objectContaining({
        ssl: false,
      }),
    );
  });

  it('should create pool with SSL when ssl is true', () => {
    createDb({
      connectionString: 'postgresql://localhost/test',
      ssl: true,
    });

    expect(MockPool).toHaveBeenCalledWith(
      expect.objectContaining({
        ssl: { rejectUnauthorized: true },
      }),
    );
  });

  it('should include CA cert when sslCaPath is provided', () => {
    createDb({
      connectionString: 'postgresql://localhost/test',
      ssl: true,
      sslCaPath: '/path/to/ca.pem',
    });

    expect(readFileSync).toHaveBeenCalledWith('/path/to/ca.pem', 'utf-8');
    expect(MockPool).toHaveBeenCalledWith(
      expect.objectContaining({
        ssl: {
          rejectUnauthorized: true,
          ca: 'mock-ca-cert-content',
        },
      }),
    );
  });

  it('should ignore sslCaPath when ssl is false', () => {
    createDb({
      connectionString: 'postgresql://localhost/test',
      ssl: false,
      sslCaPath: '/path/to/ca.pem',
    });

    expect(readFileSync).not.toHaveBeenCalled();
    expect(MockPool).toHaveBeenCalledWith(
      expect.objectContaining({
        ssl: false,
      }),
    );
  });

  it('should pass standard pool options', () => {
    createDb({ connectionString: 'postgresql://localhost/test' });

    expect(MockPool).toHaveBeenCalledWith(
      expect.objectContaining({
        max: 20,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      }),
    );
  });
});
