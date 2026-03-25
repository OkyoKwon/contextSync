import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/api-response.js';
import { testConnection, switchToRemote, getDatabaseStatus } from './setup.service.js';
import { updateDatabaseMode } from '../projects/project.repository.js';
import { syncProjectToRemote } from '../../lib/project-sync.js';

const testConnectionSchema = z.object({
  connectionUrl: z.string().min(1),
  sslEnabled: z.boolean().default(false),
});

const switchToRemoteSchema = z.object({
  connectionUrl: z.string().min(1),
  sslEnabled: z.boolean().default(false),
  projectId: z.string().uuid(),
});

export const setupRoutes: FastifyPluginAsync = async (app) => {
  // Public — no auth required (needed before login to detect DB mode)
  app.get('/setup/status', async (_request, reply) => {
    const result = getDatabaseStatus(app.env.DATABASE_URL, app.env.REMOTE_DATABASE_URL);
    return reply.send(ok(result));
  });

  // Authenticated routes in separate encapsulation context
  app.register(async (authApp) => {
    authApp.addHook('preHandler', app.authenticate);

    authApp.post('/setup/test-connection', async (request, reply) => {
      const { connectionUrl, sslEnabled } = testConnectionSchema.parse(request.body);
      const result = await testConnection(connectionUrl, sslEnabled);
      return reply.send(ok(result));
    });

    authApp.post('/setup/switch-to-remote', async (request, reply) => {
      const { connectionUrl, sslEnabled, projectId } = switchToRemoteSchema.parse(request.body);
      const userId = request.user.userId;

      try {
        const result = await switchToRemote(connectionUrl, sslEnabled, async (tempRemoteDb) => {
          // Sync project and owner user to remote DB before the temp instance is destroyed
          await syncProjectToRemote(app.localDb, tempRemoteDb, projectId, userId);
        });
        await updateDatabaseMode(app.localDb, projectId, 'remote');
        app.invalidateDbModeCache(projectId);
        return reply.send(ok(result));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Switch to remote failed';
        return reply.status(400).send(fail(message));
      }
    });
  });
};
