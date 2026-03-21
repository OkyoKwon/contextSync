import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadEnv } from '../env.js';

const REQUIRED_ENV = {
  DATABASE_URL: 'postgresql://localhost:5432/test',
  GITHUB_CLIENT_ID: 'test-id',
  GITHUB_CLIENT_SECRET: 'test-secret',
  JWT_SECRET: 'a'.repeat(32),
};

function withEnv(overrides: Record<string, string | undefined>, fn: () => void) {
  const original: Record<string, string | undefined> = {};
  for (const key of Object.keys(overrides)) {
    original[key] = process.env[key];
  }
  try {
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    fn();
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

describe('env', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of Object.keys(REQUIRED_ENV)) {
      saved[key] = process.env[key];
      process.env[key] = REQUIRED_ENV[key as keyof typeof REQUIRED_ENV];
    }
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  describe('DEPLOYMENT_MODE', () => {
    it('should default to personal', () => {
      withEnv({ DEPLOYMENT_MODE: undefined }, () => {
        const env = loadEnv();
        expect(env.DEPLOYMENT_MODE).toBe('personal');
      });
    });

    it('should accept team-host', () => {
      withEnv({ DEPLOYMENT_MODE: 'team-host' }, () => {
        const env = loadEnv();
        expect(env.DEPLOYMENT_MODE).toBe('team-host');
      });
    });

    it('should accept team-member', () => {
      withEnv({ DEPLOYMENT_MODE: 'team-member' }, () => {
        const env = loadEnv();
        expect(env.DEPLOYMENT_MODE).toBe('team-member');
      });
    });

    it('should reject invalid values', () => {
      withEnv({ DEPLOYMENT_MODE: 'invalid' }, () => {
        expect(() => loadEnv()).toThrow('Environment validation failed');
      });
    });
  });

  describe('DATABASE_SSL', () => {
    it('should default to false', () => {
      withEnv({ DATABASE_SSL: undefined }, () => {
        const env = loadEnv();
        expect(env.DATABASE_SSL).toBe(false);
      });
    });

    it('should transform "true" to boolean true', () => {
      withEnv({ DATABASE_SSL: 'true' }, () => {
        const env = loadEnv();
        expect(env.DATABASE_SSL).toBe(true);
      });
    });

    it('should transform "false" to boolean false', () => {
      withEnv({ DATABASE_SSL: 'false' }, () => {
        const env = loadEnv();
        expect(env.DATABASE_SSL).toBe(false);
      });
    });
  });

  describe('DATABASE_SSL_CA', () => {
    it('should be optional', () => {
      withEnv({ DATABASE_SSL_CA: undefined }, () => {
        const env = loadEnv();
        expect(env.DATABASE_SSL_CA).toBeUndefined();
      });
    });

    it('should accept a path string', () => {
      withEnv({ DATABASE_SSL_CA: '/path/to/ca.pem' }, () => {
        const env = loadEnv();
        expect(env.DATABASE_SSL_CA).toBe('/path/to/ca.pem');
      });
    });
  });

  describe('RUN_MIGRATIONS', () => {
    it('should default to true', () => {
      withEnv({ RUN_MIGRATIONS: undefined }, () => {
        const env = loadEnv();
        expect(env.RUN_MIGRATIONS).toBe(true);
      });
    });

    it('should transform "false" to boolean false', () => {
      withEnv({ RUN_MIGRATIONS: 'false' }, () => {
        const env = loadEnv();
        expect(env.RUN_MIGRATIONS).toBe(false);
      });
    });

    it('should transform "true" to boolean true', () => {
      withEnv({ RUN_MIGRATIONS: 'true' }, () => {
        const env = loadEnv();
        expect(env.RUN_MIGRATIONS).toBe(true);
      });
    });
  });
});
