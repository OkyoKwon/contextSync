import { describe, it, expect, vi, beforeEach } from 'vitest';

// Reset module-level state between tests
let getDatabaseStatus: typeof import('../setup.service.js').getDatabaseStatus;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('../setup.service.js');
  getDatabaseStatus = mod.getDatabaseStatus;
});

describe('getDatabaseStatus', () => {
  it('should return local mode for localhost', () => {
    const result = getDatabaseStatus('postgresql://localhost:5432/test');

    expect(result.databaseMode).toBe('local');
    expect(result.provider).toBe('local');
    expect(result.host).toBe('localhost');
    expect(result.remoteUrl).toBeNull();
  });

  it('should return local mode for 127.0.0.1', () => {
    const result = getDatabaseStatus('postgresql://127.0.0.1:5432/test');

    expect(result.databaseMode).toBe('local');
    expect(result.provider).toBe('local');
  });

  it('should return local mode for 0.0.0.0', () => {
    const result = getDatabaseStatus('postgresql://0.0.0.0:5432/test');

    expect(result.databaseMode).toBe('local');
  });

  it('should return remote mode for external hosts', () => {
    const result = getDatabaseStatus('postgresql://db.example.com:5432/test');

    expect(result.databaseMode).toBe('remote');
    expect(result.provider).toBe('custom');
    expect(result.host).toBe('*.example.com');
    expect(result.remoteUrl).toBe('postgresql://db.example.com:5432/test');
  });

  it('should detect supabase provider', () => {
    const result = getDatabaseStatus('postgresql://db.supabase.co:5432/test');

    expect(result.databaseMode).toBe('remote');
    expect(result.provider).toBe('supabase');
  });

  it('should detect supabase.com as supabase provider', () => {
    const result = getDatabaseStatus('postgresql://db.supabase.com:5432/test');

    expect(result.provider).toBe('supabase');
  });

  it('should mask remote hostname', () => {
    const result = getDatabaseStatus('postgresql://db.myhost.example.com:5432/test');

    expect(result.host).toBe('*.example.com');
  });

  it('should use remoteDbUrl parameter when provided', () => {
    const result = getDatabaseStatus(
      'postgresql://localhost:5432/test',
      'postgresql://remote.example.com:5432/test',
    );

    expect(result.remoteUrl).toBe('postgresql://remote.example.com:5432/test');
  });
});
