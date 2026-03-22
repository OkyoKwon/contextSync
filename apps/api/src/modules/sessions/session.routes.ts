import type { FastifyPluginAsync } from 'fastify';
import { ok, fail, paginated, buildPaginationMeta } from '../../lib/api-response.js';
import * as sessionService from './session.service.js';
import { importSession } from './session-import.service.js';
import { exportProjectAsMarkdown } from './session-export.service.js';
import {
  sessionFilterSchema,
  updateSessionSchema,
  tokenUsageQuerySchema,
} from './session.schema.js';
import * as tokenUsageService from './token-usage.service.js';

export const sessionRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/sessions/export/markdown',
    async (request, reply) => {
      const db = app.db;
      const { markdown, projectName } = await exportProjectAsMarkdown(
        db,
        request.params.projectId,
        request.user.userId,
      );

      const filename = `${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}-sessions.md`;

      return reply
        .header('Content-Type', 'text/markdown; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(markdown);
    },
  );

  app.post<{ Params: { projectId: string } }>(
    '/projects/:projectId/sessions/import',
    async (request, reply) => {
      const file = await request.file();
      if (!file) {
        return reply.status(400).send(fail('No file uploaded'));
      }

      const buffer = await file.toBuffer();
      const content = buffer.toString('utf-8');

      const db = app.db;
      const result = await importSession(
        db,
        request.params.projectId,
        request.user.userId,
        file.filename,
        content,
      );

      return reply.status(201).send(ok(result));
    },
  );

  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/sessions',
    async (request, reply) => {
      const db = app.db;
      const filter = sessionFilterSchema.parse(request.query);
      const result = await sessionService.getSessionsByProject(
        db,
        request.params.projectId,
        request.user.userId,
        filter,
      );

      const meta = buildPaginationMeta(result.total, filter.page, filter.limit);
      return reply.send(paginated(result.sessions, meta));
    },
  );

  app.get<{ Params: { sessionId: string } }>('/sessions/:sessionId', async (request, reply) => {
    const session = await sessionService.getSessionDetail(
      app.db,
      request.params.sessionId,
      request.user.userId,
    );
    return reply.send(ok(session));
  });

  app.patch<{ Params: { sessionId: string }; Body: unknown }>(
    '/sessions/:sessionId',
    async (request, reply) => {
      const input = updateSessionSchema.parse(request.body);
      const session = await sessionService.updateSession(
        app.db,
        request.params.sessionId,
        request.user.userId,
        input,
      );
      return reply.send(ok(session));
    },
  );

  app.delete<{ Params: { sessionId: string } }>('/sessions/:sessionId', async (request, reply) => {
    await sessionService.deleteSession(app.db, request.params.sessionId, request.user.userId);
    return reply.send(ok({ deleted: true }));
  });

  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/timeline',
    async (request, reply) => {
      const db = app.db;
      const filter = sessionFilterSchema.parse(request.query);
      const result = await sessionService.getTimeline(
        db,
        request.params.projectId,
        request.user.userId,
        filter,
      );

      const meta = buildPaginationMeta(result.total, filter.page, filter.limit);
      return reply.send(paginated(result.entries, meta));
    },
  );

  app.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/stats',
    async (request, reply) => {
      const db = app.db;
      const stats = await sessionService.getDashboardStats(
        db,
        request.params.projectId,
        request.user.userId,
      );
      return reply.send(ok(stats));
    },
  );

  app.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/team-stats',
    async (request, reply) => {
      const db = app.db;
      const stats = await sessionService.getTeamStats(
        db,
        request.params.projectId,
        request.user.userId,
      );
      return reply.send(ok(stats));
    },
  );

  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/token-usage',
    async (request, reply) => {
      const db = app.db;
      const { period } = tokenUsageQuerySchema.parse(request.query);
      const stats = await tokenUsageService.getTokenUsageStats(
        db,
        request.params.projectId,
        request.user.userId,
        period,
      );
      return reply.send(ok(stats));
    },
  );
};
