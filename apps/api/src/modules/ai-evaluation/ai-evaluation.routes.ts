import type { FastifyPluginAsync } from 'fastify';
import { ok, fail, paginated, buildPaginationMeta } from '../../lib/api-response.js';
import { getUserApiKey } from '../auth/auth.service.js';
import * as evaluationService from './ai-evaluation.service.js';
import {
  triggerEvaluationSchema,
  latestEvaluationQuerySchema,
  evaluationHistoryQuerySchema,
  backfillTranslationsSchema,
} from './ai-evaluation.schema.js';

export const aiEvaluationRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  // Trigger evaluation (creates 3 perspectives)
  app.post<{ Params: { projectId: string }; Body: unknown }>(
    '/projects/:projectId/ai-evaluation/evaluate',
    async (request, reply) => {
      const userApiKey = await getUserApiKey(app.localDb, request.user.userId);
      const apiKey = userApiKey ?? app.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return reply
          .status(400)
          .send(
            fail('Anthropic API Key가 설정되지 않았습니다. Settings에서 API Key를 설정해주세요.'),
          );
      }

      const db = await app.resolveDb(request.params.projectId);
      const input = triggerEvaluationSchema.parse(request.body);
      const result = await evaluationService.triggerEvaluation(
        db,
        apiKey,
        app.env.ANTHROPIC_MODEL,
        request.params.projectId,
        request.user.userId,
        input,
      );
      return reply.send(ok(result));
    },
  );

  // Get latest evaluation group (3 perspectives)
  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/ai-evaluation/latest-group',
    async (request, reply) => {
      const db = await app.resolveDb(request.params.projectId);
      const query = latestEvaluationQuerySchema.parse(request.query);
      const result = await evaluationService.getLatestEvaluationGroup(
        db,
        request.params.projectId,
        request.user.userId,
        query.targetUserId,
      );
      return reply.send(ok(result));
    },
  );

  // Get evaluation group by group ID
  app.get<{ Params: { projectId: string; groupId: string } }>(
    '/projects/:projectId/ai-evaluation/group/:groupId',
    async (request, reply) => {
      const db = await app.resolveDb(request.params.projectId);
      const result = await evaluationService.getEvaluationGroup(
        db,
        request.params.projectId,
        request.params.groupId,
        request.user.userId,
      );
      return reply.send(ok(result));
    },
  );

  // Get group history
  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/ai-evaluation/group-history',
    async (request, reply) => {
      const db = await app.resolveDb(request.params.projectId);
      const query = evaluationHistoryQuerySchema.parse(request.query);
      const result = await evaluationService.getEvaluationGroupHistory(
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

  // Get latest evaluation for a user (backward compatible)
  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/ai-evaluation/latest',
    async (request, reply) => {
      const db = await app.resolveDb(request.params.projectId);
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

  // Get evaluation history (backward compatible)
  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/ai-evaluation/history',
    async (request, reply) => {
      const db = await app.resolveDb(request.params.projectId);
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
      const db = await app.resolveDb(request.params.projectId);
      const result = await evaluationService.getEvaluationDetail(
        db,
        request.params.projectId,
        request.params.evaluationId,
        request.user.userId,
      );
      return reply.send(ok(result));
    },
  );

  // Backfill translations for existing evaluations
  app.post<{ Params: { projectId: string }; Body: unknown }>(
    '/projects/:projectId/ai-evaluation/backfill-translations',
    async (request, reply) => {
      const userApiKey = await getUserApiKey(app.localDb, request.user.userId);
      const apiKey = userApiKey ?? app.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return reply
          .status(400)
          .send(
            fail('Anthropic API Key가 설정되지 않았습니다. Settings에서 API Key를 설정해주세요.'),
          );
      }

      const db = await app.resolveDb(request.params.projectId);
      const input = backfillTranslationsSchema.parse(request.body ?? {});
      const result = await evaluationService.backfillTranslations(
        db,
        apiKey,
        app.env.ANTHROPIC_MODEL,
        request.params.projectId,
        request.user.userId,
        input.limit,
      );
      return reply.send(ok(result));
    },
  );

  // Get team summary
  app.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/ai-evaluation/summary',
    async (request, reply) => {
      const db = await app.resolveDb(request.params.projectId);
      const result = await evaluationService.getTeamSummary(
        db,
        request.params.projectId,
        request.user.userId,
      );
      return reply.send(ok(result));
    },
  );
};
