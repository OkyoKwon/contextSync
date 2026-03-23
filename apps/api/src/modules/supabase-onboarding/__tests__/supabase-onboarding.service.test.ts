import { describe, it, expect } from 'vitest';
import {
  buildConnectionUrl,
  resolveSupabaseErrorMessage,
  resolveConnectionErrorMessage,
} from '../supabase-onboarding.service.js';

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

describe('resolveSupabaseErrorMessage', () => {
  it('should map "Tenant or user not found" to a user-friendly message', () => {
    const result = resolveSupabaseErrorMessage('Tenant or user not found');
    expect(result).toContain('remove your token');
    expect(result).toContain('re-save');
    expect(result).not.toBe('Tenant or user not found');
  });

  it('should map case-insensitively', () => {
    const result = resolveSupabaseErrorMessage('tenant OR USER NOT FOUND');
    expect(result).toContain('remove your token');
  });

  it('should map project-not-found errors', () => {
    const result = resolveSupabaseErrorMessage('Project abc123 not found');
    expect(result).toContain('Supabase dashboard');
  });

  it('should return the raw message when no mapping matches', () => {
    const raw = 'Some unknown Supabase error';
    const result = resolveSupabaseErrorMessage(raw);
    expect(result).toBe(raw);
  });
});

describe('resolveConnectionErrorMessage', () => {
  it('should map "Tenant or user not found" to a database password message', () => {
    const result = resolveConnectionErrorMessage('Tenant or user not found');
    expect(result).toContain('database password');
    expect(result).toContain('Project Settings');
  });

  it('should map password authentication failures', () => {
    const result = resolveConnectionErrorMessage(
      'password authentication failed for user "postgres.ref"',
    );
    expect(result).toContain('Incorrect database password');
  });

  it('should map connection timeouts', () => {
    const result = resolveConnectionErrorMessage('connect ETIMEDOUT 1.2.3.4:6543');
    expect(result).toContain('Could not reach');
  });

  it('should return a prefixed raw message for unknown errors', () => {
    const result = resolveConnectionErrorMessage('Something unexpected');
    expect(result).toBe('Connection test failed: Something unexpected');
  });
});
