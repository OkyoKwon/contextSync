import { describe, it, expect } from 'vitest';
import { buildConnectionUrl } from '../supabase-onboarding.service.js';

describe('buildConnectionUrl', () => {
  it('should produce a direct connection URL with correct format', () => {
    const url = buildConnectionUrl('abcdefghijklmnop', 'mypassword');
    expect(url).toBe(
      'postgresql://postgres:mypassword@db.abcdefghijklmnop.supabase.co:5432/postgres',
    );
  });

  it('should encode special characters in the password', () => {
    const url = buildConnectionUrl('projref', 'p@ss w0rd/special#chars!');
    expect(url).toContain(encodeURIComponent('p@ss w0rd/special#chars!'));
    expect(url).not.toContain('p@ss w0rd/special#chars!');
  });

  it('should produce a parseable URL', () => {
    const url = buildConnectionUrl('myproject', 's3cret!');
    const parsed = new URL(url);
    expect(parsed.protocol).toBe('postgresql:');
    expect(parsed.hostname).toBe('db.myproject.supabase.co');
    expect(parsed.port).toBe('5432');
    expect(parsed.pathname).toBe('/postgres');
    expect(parsed.username).toBe('postgres');
    expect(parsed.password).toBe('s3cret!');
  });
});
