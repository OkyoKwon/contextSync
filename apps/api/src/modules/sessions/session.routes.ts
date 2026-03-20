import type { FastifyPluginAsync } from 'fastify';
import { ok, paginated, buildPaginationMeta } from '../../lib/api-response.js';
import * as sessionService from './session.service.js';
import { importSession } from './session-import.service.js';
import { exportProjectAsMarkdown } from './session-export.service.js';
import { listLocalDirectories, listLocalSessions, getLocalSessionDetail, getProjectConversation, syncSessions, recalculateTokenUsage } from './local-session.service.js';
import { sessionFilterSchema, updateSessionSchema, tokenUsageQuerySchema } from './session.schema.js';
import * as tokenUsageService from './token-usage.service.js';

export const sessionRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/sessions/export/markdown',
    async (request, reply) => {
      const { markdown, projectName } = await exportProjectAsMarkdown(
        app.db,
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
        return reply.status(400).send({ success: false, data: null, error: 'No file uploaded' });
      }

      const buffer = await file.toBuffer();
      const content = buffer.toString('utf-8');

      const result = await importSession(
        app.db,
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
      const filter = sessionFilterSchema.parse(request.query);
      const result = await sessionService.getSessionsByProject(
        app.db,
        request.params.projectId,
        request.user.userId,
        filter,
      );

      const meta = buildPaginationMeta(result.total, filter.page, filter.limit);
      return reply.send(paginated(result.sessions, meta));
    },
  );

  app.get<{ Params: { sessionId: string } }>(
    '/sessions/:sessionId',
    async (request, reply) => {
      const session = await sessionService.getSessionDetail(
        app.db,
        request.params.sessionId,
        request.user.userId,
      );
      return reply.send(ok(session));
    },
  );

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

  app.delete<{ Params: { sessionId: string } }>(
    '/sessions/:sessionId',
    async (request, reply) => {
      await sessionService.deleteSession(
        app.db,
        request.params.sessionId,
        request.user.userId,
      );
      return reply.send(ok({ deleted: true }));
    },
  );

  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/timeline',
    async (request, reply) => {
      const filter = sessionFilterSchema.parse(request.query);
      const result = await sessionService.getTimeline(
        app.db,
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
      const stats = await sessionService.getDashboardStats(
        app.db,
        request.params.projectId,
        request.user.userId,
      );
      return reply.send(ok(stats));
    },
  );

  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/token-usage',
    async (request, reply) => {
      const { period } = tokenUsageQuerySchema.parse(request.query);
      const stats = await tokenUsageService.getTokenUsageStats(
        app.db,
        request.params.projectId,
        request.user.userId,
        period,
      );
      return reply.send(ok(stats));
    },
  );

  app.get('/sessions/local/directories', async (_request, reply) => {
    const directories = await listLocalDirectories();
    return reply.send(ok(directories));
  });

  app.get<{ Querystring: { projectId: string; activeOnly?: string } }>(
    '/sessions/local',
    async (request, reply) => {
      const { projectId, activeOnly } = request.query;
      if (!projectId) {
        return reply.status(400).send({ success: false, data: null, error: 'projectId is required' });
      }
      const isActiveOnly = activeOnly !== 'false';
      const sessions = await listLocalSessions(app.db, projectId, isActiveOnly);
      return reply.send(ok(sessions));
    },
  );

  app.get<{ Querystring: { projectPath: string; cursor?: string; limit?: string } }>(
    '/sessions/local/project-conversation',
    async (request, reply) => {
      const { projectPath, cursor, limit } = request.query;
      if (!projectPath) {
        return reply.status(400).send({ success: false, data: null, error: 'projectPath is required' });
      }
      const parsedLimit = limit ? parseInt(limit, 10) : 100;
      const conversation = await getProjectConversation(projectPath, cursor || undefined, parsedLimit);
      return reply.send(ok(conversation));
    },
  );

  app.get<{ Params: { sessionId: string } }>(
    '/sessions/local/:sessionId',
    async (request, reply) => {
      try {
        const detail = await getLocalSessionDetail(request.params.sessionId);
        return reply.send(ok(detail));
      } catch (err) {
        if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'NOT_FOUND') {
          return reply.status(404).send({ success: false, data: null, error: err.message });
        }
        throw err;
      }
    },
  );

  app.post<{ Params: { projectId: string } }>(
    '/projects/:projectId/sessions/recalculate-tokens',
    async (request, reply) => {
      const result = await recalculateTokenUsage(
        app.db,
        request.params.projectId,
        request.user.userId,
      );
      return reply.send(ok(result));
    },
  );

  app.post<{ Params: { projectId: string }; Body: { sessionIds: readonly string[] } }>(
    '/projects/:projectId/sessions/sync',
    async (request, reply) => {
      const { sessionIds } = request.body;
      if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
        return reply.status(400).send({ success: false, data: null, error: 'sessionIds must be a non-empty array' });
      }

      const result = await syncSessions(
        app.db,
        request.params.projectId,
        request.user.userId,
        sessionIds,
      );

      return reply.status(201).send(ok(result));
    },
  );
};
