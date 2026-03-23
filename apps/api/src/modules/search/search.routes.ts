import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ok } from '../../lib/api-response.js';
import { assertProjectAccess } from '../projects/project.service.js';
import { searchInProject } from './search.service.js';

const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['all', 'session', 'message']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/search',
    async (request, reply) => {
      const db = await app.resolveDb(request.params.projectId);
      await assertProjectAccess(app.localDb, request.params.projectId, request.user.userId);

      const { q, type, page, limit } = searchQuerySchema.parse(request.query);
      const result = await searchInProject(db, request.params.projectId, q, type, page, limit);

      return reply.send(ok(result));
    },
  );
};
