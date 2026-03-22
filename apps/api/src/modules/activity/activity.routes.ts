import type { FastifyPluginAsync } from 'fastify';
import { paginated, buildPaginationMeta } from '../../lib/api-response.js';
import * as activityService from './activity.service.js';
import { activityQuerySchema } from './activity.schema.js';

export const activityRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/activity',
    async (request, reply) => {
      const db = app.db;
      const { page, limit } = activityQuerySchema.parse(request.query);
      const result = await activityService.getProjectActivity(
        db,
        request.params.projectId,
        request.user.userId,
        page,
        limit,
      );

      const meta = buildPaginationMeta(result.total, page, limit);
      return reply.send(paginated(result.entries, meta));
    },
  );
};
