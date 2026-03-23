import { describe, it, expect } from 'vitest';
import { buildConnectionUrl } from '../supabase-onboarding.service.js';

describe('buildConnectionUrl', () => {
  it('should produce a transaction-mode pooler URL with correct format', () => {
    const url = buildConnectionUrl('abcdefghijklmnop', 'mypassword', 'us-east-1');
    expect(url).toBe(
      'postgresql://postgres.abcdefghijklmnop:mypassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
    );
  });

  it('should encode special characters in the password', () => {
    const url = buildConnectionUrl('projref', 'p@ss w0rd/special#chars!', 'eu-west-1');
    expect(url).toContain(encodeURIComponent('p@ss w0rd/special#chars!'));
    expect(url).not.toContain('p@ss w0rd/special#chars!');
  });

  it('should produce a parseable URL', () => {
    const url = buildConnectionUrl('myproject', 's3cret!', 'ap-southeast-1');
    const parsed = new URL(url);
    expect(parsed.protocol).toBe('postgresql:');
    expect(parsed.hostname).toBe('aws-0-ap-southeast-1.pooler.supabase.com');
    expect(parsed.port).toBe('6543');
    expect(parsed.pathname).toBe('/postgres');
    expect(parsed.username).toBe('postgres.myproject');
    expect(parsed.password).toBe('s3cret!');
  });
});
