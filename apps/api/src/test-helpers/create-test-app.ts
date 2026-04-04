/**
 * Test helper: builds a Fastify app instance with all plugins registered
 * but with a mocked database layer. Uses Fastify inject for HTTP-level testing.
 */
import Fastify, { type FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { registerCors } from '../plugins/cors.plugin.js';
import { registerErrorHandler } from '../plugins/error-handler.plugin.js';
import { registerJwt } from '../plugins/auth.plugin.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { projectRoutes } from '../modules/projects/project.routes.js';
import { sessionRoutes } from '../modules/sessions/session.routes.js';
import { conflictRoutes } from '../modules/conflicts/conflict.routes.js';
import { searchRoutes } from '../modules/search/search.routes.js';
import { planRoutes } from '../modules/plans/plan.routes.js';
import { activityRoutes } from '../modules/activity/activity.routes.js';
import { quotaRoutes } from '../modules/quota/quota.routes.js';
import { adminRoutes } from '../modules/admin/admin.routes.js';
import { notificationRoutes } from '../modules/notifications/notification.routes.js';
import { localSessionRoutes } from '../modules/local-sessions/local-session.routes.js';
import { setupRoutes } from '../modules/setup/setup.routes.js';
import { aiEvaluationRoutes } from '../modules/ai-evaluation/ai-evaluation.routes.js';
import { prdAnalysisRoutes } from '../modules/prd-analysis/prd-analysis.routes.js';
import type { Env } from '../config/env.js';
import type { Db } from '../database/client.js';

export const TEST_JWT_SECRET = 'test-jwt-secret-for-integration-tests-minimum-32-chars';

export const TEST_ENV: Env = {
  PORT: 0,
  HOST: '127.0.0.1',
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://localhost:5432/test',
  JWT_SECRET: TEST_JWT_SECRET,
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

/**
 * Creates a mock Db object. Callers should override specific methods with vi.fn()
 * for individual test scenarios.
 */
export function createMockDb(): Db {
  const mockQueryBuilder = {
    selectAll: () => mockQueryBuilder,
    select: () => mockQueryBuilder,
    where: () => mockQueryBuilder,
    orderBy: () => mockQueryBuilder,
    limit: () => mockQueryBuilder,
    offset: () => mockQueryBuilder,
    execute: () => Promise.resolve([]),
    executeTakeFirst: () => Promise.resolve(undefined),
    executeTakeFirstOrThrow: () => Promise.reject(new Error('No result')),
    set: () => mockQueryBuilder,
    values: () => mockQueryBuilder,
    returningAll: () => mockQueryBuilder,
    returning: () => mockQueryBuilder,
    innerJoin: () => mockQueryBuilder,
    leftJoin: () => mockQueryBuilder,
    groupBy: () => mockQueryBuilder,
    having: () => mockQueryBuilder,
  };

  return {
    selectFrom: () => mockQueryBuilder,
    insertInto: () => mockQueryBuilder,
    updateTable: () => mockQueryBuilder,
    deleteFrom: () => mockQueryBuilder,
    transaction: () => ({ execute: (fn: (trx: unknown) => unknown) => fn(createMockDb()) }),
    destroy: () => Promise.resolve(),
  } as unknown as Db;
}

export interface TestAppOptions {
  readonly db?: Db;
  readonly routes?: ReadonlyArray<{
    readonly plugin: Parameters<FastifyInstance['register']>[0];
    readonly prefix: string;
  }>;
}

/**
 * Builds a fully-configured Fastify app for integration testing.
 * The database is mocked by default; pass a custom db to override.
 */
export async function createTestApp(options: TestAppOptions = {}): Promise<FastifyInstance> {
  const db = options.db ?? createMockDb();

  const app = Fastify({ logger: false });

  app.decorate('db', db);
  app.decorate('localDb', db);
  app.decorate('remoteDb', null);
  app.decorate('resolveDb', async () => db);
  app.decorate('invalidateDbModeCache', () => {});
  app.decorate('env', TEST_ENV);
  app.decorate('lastAuthUserId', null as string | null);

  await registerCors(app, TEST_ENV.FRONTEND_URL);
  registerErrorHandler(app);
  await registerJwt(app, TEST_JWT_SECRET);
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  // Track last authenticated user (same as production app)
  app.addHook('onRequest', async (request) => {
    try {
      await request.jwtVerify();
      app.lastAuthUserId = request.user.userId;
    } catch {
      // Not authenticated -- skip
    }
  });

  if (options.routes) {
    for (const route of options.routes) {
      await app.register(route.plugin, { prefix: route.prefix });
    }
  } else {
    // Register all standard routes
    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.register(projectRoutes, { prefix: '/api' });
    await app.register(sessionRoutes, { prefix: '/api' });
    await app.register(conflictRoutes, { prefix: '/api' });
    await app.register(searchRoutes, { prefix: '/api' });
    await app.register(planRoutes, { prefix: '/api' });
    await app.register(activityRoutes, { prefix: '/api' });
    await app.register(quotaRoutes, { prefix: '/api' });
    await app.register(adminRoutes, { prefix: '/api' });
    await app.register(notificationRoutes, { prefix: '/api' });
    await app.register(localSessionRoutes, { prefix: '/api' });
    await app.register(setupRoutes, { prefix: '/api' });
    await app.register(aiEvaluationRoutes, { prefix: '/api' });
    await app.register(prdAnalysisRoutes, { prefix: '/api' });
  }

  app.get('/api/health', async () => ({ status: 'ok' }));

  await app.ready();
  return app;
}
