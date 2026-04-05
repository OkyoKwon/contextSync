import { z } from 'zod';

const DEV_JWT_SECRET = 'contextsync-dev-jwt-secret-do-not-use-in-production!!';

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32).default(DEV_JWT_SECRET),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-20250514'),

  SLACK_WEBHOOK_URL: z.string().optional(),

  DATABASE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  DATABASE_SSL_CA: z.string().optional(),

  REMOTE_DATABASE_URL: z.preprocess((v) => (v === '' ? undefined : v), z.string().url().optional()),
  REMOTE_DATABASE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  REMOTE_DATABASE_SSL_CA: z.string().optional(),

  RUN_MIGRATIONS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  AUTO_SYNC_INTERVAL_MS: z.coerce.number().min(0).default(30000),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    const messages = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${errors?.join(', ')}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${messages}`);
  }
  const env = result.data;

  if (env.NODE_ENV === 'production' && env.JWT_SECRET === DEV_JWT_SECRET) {
    throw new Error(
      'JWT_SECRET must be set to a unique value in production. ' +
        'The default dev secret is not allowed.',
    );
  }

  return env;
}
