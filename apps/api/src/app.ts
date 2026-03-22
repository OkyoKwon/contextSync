import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import type { Env } from './config/env.js';
import { registerCors } from './plugins/cors.plugin.js';
import { registerErrorHandler } from './plugins/error-handler.plugin.js';
import { registerJwt } from './plugins/auth.plugin.js';
import { createDb } from './database/client.js';
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
import { runMigrations } from './modules/admin/admin.service.js';

export async function buildApp(env: Env) {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
  });

  const db = createDb({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL,
    sslCaPath: env.DATABASE_SSL_CA,
  });
  app.decorate('db', db);
  app.decorate('env', env);

  await registerCors(app, env.FRONTEND_URL);
  registerErrorHandler(app);
  await registerJwt(app, env.JWT_SECRET);
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

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

  app.get('/api/health', async () => ({ status: 'ok' }));

  if (env.RUN_MIGRATIONS) {
    const result = await runMigrations(db);
    for (const name of result.applied) {
      app.log.info(`Migration "${name}" applied`);
    }
    if (result.errors.length > 0) {
      app.log.error(`Migration errors: ${result.errors.join(', ')}`);
    }
  }

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof createDb>;
    env: Env;
  }
}
