import type { FastifyPluginAsync } from 'fastify';
import { ok, paginated, buildPaginationMeta } from '../../lib/api-response.js';
import { resolveProjectDb } from '../../lib/resolve-project-db.js';
import * as evaluationService from './ai-evaluation.service.js';
import {
  triggerEvaluationSchema,
  latestEvaluationQuerySchema,
  evaluationHistoryQuerySchema,
} from './ai-evaluation.schema.js';

export const aiEvaluationRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  // Trigger evaluation
  app.post<{ Params: { projectId: string }; Body: unknown }>(
    '/projects/:projectId/ai-evaluation/evaluate',
    async (request, reply) => {
      const db = await resolveProjectDb(app, request.params.projectId);
      const input = triggerEvaluationSchema.parse(request.body);
      const result = await evaluationService.triggerEvaluation(
        db,
        app.env,
        request.params.projectId,
        request.user.userId,
        input,
      );
      return reply.send(ok(result));
    },
  );

  // Get latest evaluation for a user
  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/ai-evaluation/latest',
    async (request, reply) => {
      const db = await resolveProjectDb(app, request.params.projectId);
      const query = latestEvaluationQuerySchema.parse(request.query);
      const result = await evaluationService.getLatestEvaluation(
        db,
        request.params.projectId,
        request.user.userId,
        query.targetUserId,
      );
      return reply.send(ok(result));
    },
  );

  // Get evaluation history
  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/ai-evaluation/history',
    async (request, reply) => {
      const db = await resolveProjectDb(app, request.params.projectId);
      const query = evaluationHistoryQuerySchema.parse(request.query);
      const result = await evaluationService.getEvaluationHistory(
        db,
        request.params.projectId,
        request.user.userId,
        query.targetUserId,
        query.page,
        query.limit,
      );
      const meta = buildPaginationMeta(result.total, query.page, query.limit);
      return reply.send(paginated(result.entries, meta));
    },
  );

  // Get evaluation detail
  app.get<{ Params: { projectId: string; evaluationId: string } }>(
    '/projects/:projectId/ai-evaluation/:evaluationId',
    async (request, reply) => {
      const db = await resolveProjectDb(app, request.params.projectId);
      const result = await evaluationService.getEvaluationDetail(
        db,
        request.params.projectId,
        request.params.evaluationId,
        request.user.userId,
      );
      return reply.send(ok(result));
    },
  );

  // Get team summary
  app.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/ai-evaluation/summary',
    async (request, reply) => {
      const db = await resolveProjectDb(app, request.params.projectId);
      const result = await evaluationService.getTeamSummary(
        db,
        request.params.projectId,
        request.user.userId,
      );
      return reply.send(ok(result));
    },
  );
};
