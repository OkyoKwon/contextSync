import type { FastifyPluginAsync } from 'fastify';
import { ok } from '../../lib/api-response.js';
import { getQuotaStatus, detectPlan } from './quota.service.js';

export const quotaRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get('/auth/me/quota', async (request, reply) => {
    const status = await getQuotaStatus(app.db, request.user.userId);
    return reply.send(ok(status));
  });

  app.post('/auth/me/plan/detect', async (request, reply) => {
    const result = await detectPlan(app.db, request.user.userId);
    return reply.send(ok(result));
  });
};
