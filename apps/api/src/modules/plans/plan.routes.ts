import type { FastifyPluginAsync } from 'fastify';
import { ok } from '../../lib/api-response.js';
import * as planService from './plan.service.js';
import { planFilenameSchema } from './plan.schema.js';

export const planRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get('/plans/local', async (_request, reply) => {
    const plans = await planService.listPlans(app.localDb);
    return reply.send(ok(plans));
  });

  app.get<{ Params: { filename: string } }>('/plans/local/:filename', async (request, reply) => {
    const filename = planFilenameSchema.parse(request.params.filename);
    const plan = await planService.getPlanDetail(app.localDb, filename);
    return reply.send(ok(plan));
  });

  app.delete<{ Params: { filename: string } }>('/plans/local/:filename', async (request, reply) => {
    const filename = planFilenameSchema.parse(request.params.filename);
    await planService.deletePlan(filename);
    return reply.send(ok(null));
  });
};
