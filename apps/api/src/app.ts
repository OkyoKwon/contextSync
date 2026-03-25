import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import type { Env } from './config/env.js';
import { registerCors } from './plugins/cors.plugin.js';
import { registerErrorHandler } from './plugins/error-handler.plugin.js';
import { registerJwt } from './plugins/auth.plugin.js';
import { createDb, type Db } from './database/client.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { projectRoutes } from './modules/projects/project.routes.js';
import { sessionRoutes } from './modules/sessions/session.routes.js';
import { conflictRoutes } from './modules/conflicts/conflict.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { notificationRoutes } from './modules/notifications/notification.routes.js';
import { prdAnalysisRoutes } from './modules/prd-analysis/prd-analysis.routes.js';
import { activityRoutes } from './modules/activity/activity.routes.js';
import { planRoutes } from './modules/plans/plan.routes.js';
import { aiEvaluationRoutes } from './modules/ai-evaluation/ai-evaluation.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { setupRoutes } from './modules/setup/setup.routes.js';
import { supabaseOnboardingRoutes } from './modules/supabase-onboarding/supabase-onboarding.routes.js';
import { localSessionRoutes } from './modules/local-sessions/local-session.routes.js';
import { quotaRoutes } from './modules/quota/quota.routes.js';
import { runMigrations } from './modules/admin/admin.service.js';
import { autoSyncPlugin } from './plugins/auto-sync.plugin.js';

export async function buildApp(env: Env) {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
  });

  const localDb = createDb({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL,
    sslCaPath: env.DATABASE_SSL_CA,
  });
  const remoteDb = env.REMOTE_DATABASE_URL
    ? createDb({
        connectionString: env.REMOTE_DATABASE_URL,
        ssl: env.REMOTE_DATABASE_SSL,
        sslCaPath: env.REMOTE_DATABASE_SSL_CA,
      })
    : null;

  // projectId → databaseMode cache (TTL 5 min)
  const dbModeCache = new Map<string, { readonly mode: string; readonly expiry: number }>();
  const CACHE_TTL = 5 * 60 * 1000;

  async function resolveDb(projectId: string): Promise<Db> {
    const cached = dbModeCache.get(projectId);
    if (cached && cached.expiry > Date.now()) {
      return cached.mode === 'remote' && remoteDb ? remoteDb : localDb;
    }

    const project = await localDb
      .selectFrom('projects')
      .select('database_mode')
      .where('id', '=', projectId)
      .executeTakeFirst();

    const mode = project?.database_mode ?? 'local';
    dbModeCache.set(projectId, { mode, expiry: Date.now() + CACHE_TTL });
    return mode === 'remote' && remoteDb ? remoteDb : localDb;
  }

  function invalidateDbModeCache(projectId: string): void {
    dbModeCache.delete(projectId);
  }

  // Backward compat: app.db = localDb (routes can migrate incrementally)
  app.decorate('db', localDb);
  app.decorate('localDb', localDb);
  app.decorate('remoteDb', remoteDb);
  app.decorate('resolveDb', resolveDb);
  app.decorate('invalidateDbModeCache', invalidateDbModeCache);
  app.decorate('env', env);
  app.decorate('lastAuthUserId', null as string | null);

  await registerCors(app, env.FRONTEND_URL);
  registerErrorHandler(app);
  await registerJwt(app, env.JWT_SECRET);
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  // Track last authenticated user for background auto-sync
  app.addHook('onRequest', async (request) => {
    try {
      await request.jwtVerify();
      app.lastAuthUserId = request.user.userId;
    } catch {
      // Not authenticated — skip silently
    }
  });

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(projectRoutes, { prefix: '/api' });
  await app.register(sessionRoutes, { prefix: '/api' });
  await app.register(conflictRoutes, { prefix: '/api' });
  await app.register(searchRoutes, { prefix: '/api' });
  await app.register(notificationRoutes, { prefix: '/api' });
  await app.register(prdAnalysisRoutes, { prefix: '/api' });
  await app.register(activityRoutes, { prefix: '/api' });
  await app.register(planRoutes, { prefix: '/api' });
  await app.register(aiEvaluationRoutes, { prefix: '/api' });
  await app.register(adminRoutes, { prefix: '/api' });
  await app.register(setupRoutes, { prefix: '/api' });
  await app.register(supabaseOnboardingRoutes, { prefix: '/api' });
  await app.register(localSessionRoutes, { prefix: '/api' });
  await app.register(quotaRoutes, { prefix: '/api' });

  app.get('/api/health', async () => ({ status: 'ok' }));

  if (env.RUN_MIGRATIONS) {
    const result = await runMigrations(localDb);
    for (const name of result.applied) {
      app.log.info(`Migration "${name}" applied`);
    }
    if (result.errors.length > 0) {
      app.log.error(`Migration errors: ${result.errors.join(', ')}`);
    }
  }

  await app.register(autoSyncPlugin);

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
    localDb: Db;
    remoteDb: Db | null;
    resolveDb: (projectId: string) => Promise<Db>;
    invalidateDbModeCache: (projectId: string) => void;
    env: Env;
    lastAuthUserId: string | null;
  }
}
