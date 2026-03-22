import type { FastifyPluginAsync } from 'fastify';
import { ok, paginated, buildPaginationMeta } from '../../lib/api-response.js';
import { resolveProjectDb } from '../../lib/resolve-project-db.js';
import * as conflictService from './conflict.service.js';
import {
  conflictFilterSchema,
  updateConflictSchema,
  assignReviewerSchema,
  reviewNotesSchema,
} from './conflict.schema.js';

export const conflictRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/conflicts',
    async (request, reply) => {
      const db = await resolveProjectDb(app, request.params.projectId);
      const filter = conflictFilterSchema.parse(request.query);
      const result = await conflictService.getConflictsByProject(
        db,
        request.params.projectId,
        request.user.userId,
        filter,
      );

      const meta = buildPaginationMeta(result.total, filter.page, filter.limit);
      return reply.send(paginated(result.conflicts, meta));
    },
  );

  app.get<{ Params: { conflictId: string } }>('/conflicts/:conflictId', async (request, reply) => {
    const conflict = await conflictService.getConflictDetail(
      app.db,
      request.params.conflictId,
      request.user.userId,
    );
    return reply.send(ok(conflict));
  });

  app.patch<{ Params: { conflictId: string }; Body: unknown }>(
    '/conflicts/:conflictId',
    async (request, reply) => {
      const input = updateConflictSchema.parse(request.body);
      const conflict = await conflictService.updateConflictStatus(
        app.db,
        request.params.conflictId,
        request.user.userId,
        input.status,
      );
      return reply.send(ok(conflict));
    },
  );

  app.patch<{ Params: { conflictId: string }; Body: unknown }>(
    '/conflicts/:conflictId/assign',
    async (request, reply) => {
      const { reviewerId } = assignReviewerSchema.parse(request.body);
      const conflict = await conflictService.assignReviewer(
        app.db,
        request.params.conflictId,
        request.user.userId,
        reviewerId,
      );
      return reply.send(ok(conflict));
    },
  );

  app.patch<{ Params: { conflictId: string }; Body: unknown }>(
    '/conflicts/:conflictId/review-notes',
    async (request, reply) => {
      const { reviewNotes } = reviewNotesSchema.parse(request.body);
      const conflict = await conflictService.addReviewNotes(
        app.db,
        request.params.conflictId,
        request.user.userId,
        reviewNotes,
      );
      return reply.send(ok(conflict));
    },
  );
};
