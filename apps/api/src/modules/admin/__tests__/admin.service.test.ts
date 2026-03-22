import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertAdmin, assertOwnerRole, getAdminConfig } from '../admin.service.js';
import { ForbiddenError } from '../../../plugins/error-handler.plugin.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('assertAdmin', () => {
  it('should not throw when role is owner', () => {
    expect(() => assertAdmin('owner')).not.toThrow();
  });

  it('should not throw when role is admin', () => {
    expect(() => assertAdmin('admin')).not.toThrow();
  });

  it('should throw ForbiddenError when role is member', () => {
    expect(() => assertAdmin('member')).toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError when role is empty string', () => {
    expect(() => assertAdmin('')).toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError with descriptive message', () => {
    expect(() => assertAdmin('member')).toThrow('Admin access requires owner or admin role');
  });
});

describe('assertOwnerRole', () => {
  it('should not throw when role is owner', () => {
    expect(() => assertOwnerRole('owner')).not.toThrow();
  });

  it('should throw ForbiddenError when role is admin', () => {
    expect(() => assertOwnerRole('admin')).toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError when role is member', () => {
    expect(() => assertOwnerRole('member')).toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError with descriptive message', () => {
    expect(() => assertOwnerRole('admin')).toThrow('This action requires owner role');
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
