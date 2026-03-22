import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/api-response.js';
import { testConnection, switchToRemote } from './setup.service.js';

const testConnectionSchema = z.object({
  connectionUrl: z.string().min(1),
  sslEnabled: z.boolean().default(false),
});

const switchToRemoteSchema = z.object({
  connectionUrl: z.string().min(1),
  sslEnabled: z.boolean().default(false),
});

export const setupRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.post('/setup/test-connection', async (request, reply) => {
    const { connectionUrl, sslEnabled } = testConnectionSchema.parse(request.body);
    const result = await testConnection(connectionUrl, sslEnabled);
    return reply.send(ok(result));
  });

  app.post('/setup/switch-to-remote', async (request, reply) => {
    const { connectionUrl, sslEnabled } = switchToRemoteSchema.parse(request.body);

    try {
      const result = await switchToRemote(connectionUrl, sslEnabled);
      return reply.send(ok(result));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Switch to remote failed';
      return reply.status(400).send(fail(message));
    }
  });
};
