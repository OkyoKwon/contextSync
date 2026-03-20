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

export async function buildApp(env: Env) {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
  });

  const db = createDb(env.DATABASE_URL);
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

  app.get('/api/health', async () => ({ status: 'ok' }));

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof createDb>;
    env: Env;
  }
}
