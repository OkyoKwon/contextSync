import { describe, it, expect } from 'vitest';
import { assertOwnerRole, getAdminConfig } from '../admin.service.js';
import { ForbiddenError } from '../../../plugins/error-handler.plugin.js';
import type { Env } from '../../../config/env.js';

describe('assertOwnerRole', () => {
  it('should not throw for owner role', () => {
    expect(() => assertOwnerRole('owner')).not.toThrow();
  });

  it('should throw ForbiddenError for user role', () => {
    expect(() => assertOwnerRole('user')).toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError for admin role', () => {
    expect(() => assertOwnerRole('admin')).toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError for empty string', () => {
    expect(() => assertOwnerRole('')).toThrow(ForbiddenError);
  });
});

describe('getAdminConfig', () => {
  const baseEnv: Env = {
    PORT: 3001,
    HOST: '0.0.0.0',
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://user:password@localhost:5432/mydb',
    JWT_SECRET: 'secret',
    JWT_EXPIRES_IN: '7d',
    FRONTEND_URL: 'http://localhost:5173',
    ANTHROPIC_API_KEY: undefined,
    ANTHROPIC_MODEL: 'claude-sonnet-4-20250514',
    SLACK_WEBHOOK_URL: undefined,
    DATABASE_SSL: false,
    DATABASE_SSL_CA: undefined,
    REMOTE_DATABASE_URL: undefined,
    REMOTE_DATABASE_SSL: false,
    REMOTE_DATABASE_SSL_CA: undefined,
    RUN_MIGRATIONS: false,
    AUTO_SYNC_INTERVAL_MS: 0,
  };

  it('should mask password in connection string', () => {
    const config = getAdminConfig(baseEnv);

    expect(config.connectionString).toContain('****');
    expect(config.connectionString).not.toContain('password');
  });

  it('should return sslEnabled from env', () => {
    const config = getAdminConfig({ ...baseEnv, DATABASE_SSL: true });

    expect(config.sslEnabled).toBe(true);
  });

  it('should handle invalid URL gracefully', () => {
    const config = getAdminConfig({ ...baseEnv, DATABASE_URL: 'not-a-url' });

    expect(config.connectionString).toBe('****');
  });
});
