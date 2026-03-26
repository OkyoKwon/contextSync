import type { FastifyPluginAsync } from 'fastify';
import { ok, paginated, buildPaginationMeta } from '../../lib/api-response.js';
import * as conflictService from './conflict.service.js';
import {
  conflictFilterSchema,
  updateConflictSchema,
  assignReviewerSchema,
  reviewNotesSchema,
  batchResolveSchema,
} from './conflict.schema.js';
import { findConflictById } from './conflict.repository.js';
import { NotFoundError, AppError } from '../../plugins/error-handler.plugin.js';
import { getUserApiKey } from '../auth/auth.service.js';

export const conflictRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/conflicts',
    async (request, reply) => {
      const db = await app.resolveDb(request.params.projectId);
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

  app.patch<{ Params: { projectId: string }; Body: unknown }>(
    '/projects/:projectId/conflicts/batch-resolve',
    async (request, reply) => {
      const db = await app.resolveDb(request.params.projectId);
      const input = batchResolveSchema.parse(request.body);
      const result = await conflictService.batchResolveConflicts(
        db,
        request.params.projectId,
        request.user.userId,
        input.status,
      );
      return reply.send(ok(result));
    },
  );

  app.post<{ Params: { projectId: string } }>(
    '/projects/:projectId/conflicts/overview-analysis',
    async (request, reply) => {
      const userApiKey = await getUserApiKey(app.localDb, request.user.userId);
      const apiKey = userApiKey ?? app.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new AppError('Anthropic API Key가 설정되지 않았습니다', 400);
      }

      const db = await app.resolveDb(request.params.projectId);
      const result = await conflictService.getConflictOverview(
        db,
        apiKey,
        app.env.ANTHROPIC_MODEL,
        request.params.projectId,
        request.user.userId,
      );
      return reply.send(ok(result));
    },
  );

  app.get<{ Params: { conflictId: string } }>('/conflicts/:conflictId', async (request, reply) => {
    const { conflictId } = request.params;
    let db = app.localDb;
    let conflict = await findConflictById(db, conflictId);
    if (!conflict && app.remoteDb) {
      db = app.remoteDb;
      conflict = await findConflictById(db, conflictId);
    }
    if (!conflict) throw new NotFoundError('Conflict');

    const detail = await conflictService.getConflictDetail(db, conflictId, request.user.userId);
    return reply.send(ok(detail));
  });

  app.patch<{ Params: { conflictId: string }; Body: unknown }>(
    '/conflicts/:conflictId',
    async (request, reply) => {
      const { conflictId } = request.params;
      let db = app.localDb;
      let conflict = await findConflictById(db, conflictId);
      if (!conflict && app.remoteDb) {
        db = app.remoteDb;
        conflict = await findConflictById(db, conflictId);
      }
      if (!conflict) throw new NotFoundError('Conflict');

      const input = updateConflictSchema.parse(request.body);
      const updated = await conflictService.updateConflictStatus(
        db,
        conflictId,
        request.user.userId,
        input.status,
      );
      return reply.send(ok(updated));
    },
  );

  app.post<{ Params: { conflictId: string } }>(
    '/conflicts/:conflictId/ai-verify',
    async (request, reply) => {
      const userApiKey = await getUserApiKey(app.localDb, request.user.userId);
      const apiKey = userApiKey ?? app.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new AppError('Anthropic API Key가 설정되지 않았습니다', 400);
      }

      const { conflictId } = request.params;
      let db = app.localDb;
      let conflict = await findConflictById(db, conflictId);
      if (!conflict && app.remoteDb) {
        db = app.remoteDb;
        conflict = await findConflictById(db, conflictId);
      }
      if (!conflict) throw new NotFoundError('Conflict');

      const updated = await conflictService.aiVerifyConflict(
        db,
        apiKey,
        app.env.ANTHROPIC_MODEL,
        conflictId,
        request.user.userId,
      );
      return reply.send(ok(updated));
    },
  );

  app.patch<{ Params: { conflictId: string }; Body: unknown }>(
    '/conflicts/:conflictId/assign',
    async (request, reply) => {
      const { conflictId } = request.params;
      let db = app.localDb;
      let conflict = await findConflictById(db, conflictId);
      if (!conflict && app.remoteDb) {
        db = app.remoteDb;
        conflict = await findConflictById(db, conflictId);
      }
      if (!conflict) throw new NotFoundError('Conflict');

      const { reviewerId } = assignReviewerSchema.parse(request.body);
      const updated = await conflictService.assignReviewer(
        db,
        conflictId,
        request.user.userId,
        reviewerId,
      );
      return reply.send(ok(updated));
    },
  );

  app.patch<{ Params: { conflictId: string }; Body: unknown }>(
    '/conflicts/:conflictId/review-notes',
    async (request, reply) => {
      const { conflictId } = request.params;
      let db = app.localDb;
      let conflict = await findConflictById(db, conflictId);
      if (!conflict && app.remoteDb) {
        db = app.remoteDb;
        conflict = await findConflictById(db, conflictId);
      }
      if (!conflict) throw new NotFoundError('Conflict');

      const { reviewNotes } = reviewNotesSchema.parse(request.body);
      const updated = await conflictService.addReviewNotes(
        db,
        conflictId,
        request.user.userId,
        reviewNotes,
      );
      return reply.send(ok(updated));
    },
  );
};
