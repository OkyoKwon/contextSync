import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildConnectionUrl,
  resolveSupabaseErrorMessage,
  resolveConnectionErrorMessage,
} from '../supabase-onboarding.service.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('buildConnectionUrl — additional edge cases', () => {
  it('should handle empty password', () => {
    const url = buildConnectionUrl('projref', '', 'us-east-1');
    const parsed = new URL(url);
    expect(parsed.password).toBe('');
    expect(parsed.username).toBe('postgres.projref');
  });

  it('should handle unicode characters in password', () => {
    const url = buildConnectionUrl('projref', 'p@ss\u00e9', 'us-east-1');
    expect(url).toContain(encodeURIComponent('p@ss\u00e9'));
  });

  it('should produce correct region in hostname', () => {
    const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];
    for (const region of regions) {
      const url = buildConnectionUrl('ref', 'pwd', region);
      expect(url).toContain(`aws-0-${region}.pooler.supabase.com`);
    }
  });
});

describe('resolveSupabaseErrorMessage — additional edge cases', () => {
  it('should handle empty string', () => {
    const result = resolveSupabaseErrorMessage('');
    expect(result).toBe('');
  });

  it('should map project not found with various refs', () => {
    const result = resolveSupabaseErrorMessage('Project xyz789 not found');
    expect(result).toContain('Supabase dashboard');
  });

  it('should return raw message for generic API errors', () => {
    const raw = 'Rate limit exceeded';
    expect(resolveSupabaseErrorMessage(raw)).toBe(raw);
  });
});

describe('resolveConnectionErrorMessage — additional edge cases', () => {
  it('should handle ECONNREFUSED error', () => {
    const result = resolveConnectionErrorMessage('connect ECONNREFUSED 127.0.0.1:6543');
    expect(result).toContain('Could not reach');
  });

  it('should handle ENOTFOUND error', () => {
    const result = resolveConnectionErrorMessage('getaddrinfo ENOTFOUND host.example.com');
    expect(result).toContain('Could not reach');
  });

  it('should handle empty string', () => {
    const result = resolveConnectionErrorMessage('');
    expect(result).toBe('Connection test failed: ');
  });

  it('should handle multiple matching patterns (first match wins)', () => {
    // "Tenant or user not found" should match the first pattern
    const result = resolveConnectionErrorMessage('Tenant or user not found');
    expect(result).toContain('database password');
  });
});
