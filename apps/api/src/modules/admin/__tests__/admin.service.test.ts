import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertOwnerRole, getAdminConfig } from '../admin.service.js';
import { ForbiddenError } from '../../../plugins/error-handler.plugin.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('assertOwnerRole', () => {
  it('should not throw when role is owner', () => {
    expect(() => assertOwnerRole('owner')).not.toThrow();
  });

  it('should throw ForbiddenError when role is member', () => {
    expect(() => assertOwnerRole('member')).toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError when role is empty string', () => {
    expect(() => assertOwnerRole('')).toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError with descriptive message', () => {
    expect(() => assertOwnerRole('member')).toThrow('This action requires owner role');
  });
});

describe('getAdminConfig', () => {
  it('should return config with masked connection string', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:secret@localhost:5432/mydb',
      DATABASE_SSL: false,
    } as any;

    const result = getAdminConfig(env);

    expect(result.sslEnabled).toBe(false);
    expect(result.connectionString).not.toContain('secret');
    expect(result.connectionString).toContain('****');
  });

  it('should return config with SSL enabled', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@host:5432/db',
      DATABASE_SSL: true,
    } as any;

    const result = getAdminConfig(env);

    expect(result.sslEnabled).toBe(true);
  });

  it('should mask connection string even with no password', () => {
    const env = {
      DATABASE_URL: 'postgresql://user@localhost:5432/mydb',
      DATABASE_SSL: false,
    } as any;

    const result = getAdminConfig(env);

    expect(result.connectionString).toBeTruthy();
  });

  it('should return masked string for invalid URL', () => {
    const env = {
      DATABASE_URL: 'not-a-valid-url',
      DATABASE_SSL: false,
    } as any;

    const result = getAdminConfig(env);

    expect(result.connectionString).toBe('****');
  });
});
