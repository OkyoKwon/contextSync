import type { FastifyPluginAsync } from 'fastify';
import { ok, fail } from '../../lib/api-response.js';
import {
  listLocalDirectories,
  listLocalSessions,
  getLocalSessionDetail,
  getProjectConversation,
  browseDirectory,
} from './local-session.service.js';
import { syncSessions, recalculateTokenUsage } from './local-session.sync.js';

export const localSessionRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get<{ Querystring: { path?: string } }>('/sessions/local/browse', async (request, reply) => {
    try {
      const entries = await browseDirectory(request.query.path || undefined);
      return reply.send(ok(entries));
    } catch (err) {
      if (err instanceof Error && (err as { statusCode?: number }).statusCode === 400) {
        return reply.status(400).send(fail(err.message));
      }
      throw err;
    }
  });

  app.get('/sessions/local/directories', async (_request, reply) => {
    const directories = await listLocalDirectories();
    return reply.send(ok(directories));
  });

  app.get<{ Querystring: { projectId: string; activeOnly?: string } }>(
    '/sessions/local',
    async (request, reply) => {
      const { projectId, activeOnly } = request.query;
      if (!projectId) {
        return reply.status(400).send(fail('projectId is required'));
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
        return reply.status(400).send(fail('projectPath is required'));
      }
      const parsedLimit = limit ? parseInt(limit, 10) : 100;
      const conversation = await getProjectConversation(
        projectPath,
        cursor || undefined,
        parsedLimit,
      );
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
          return reply.status(404).send(fail(err.message));
        }
        throw err;
      }
    },
  );

  app.post<{ Params: { projectId: string } }>(
    '/projects/:projectId/sessions/recalculate-tokens',
    async (request, reply) => {
      const db = app.db;
      const result = await recalculateTokenUsage(db, request.params.projectId, request.user.userId);
      return reply.send(ok(result));
    },
  );

  app.post<{ Params: { projectId: string }; Body: { sessionIds: readonly string[] } }>(
    '/projects/:projectId/sessions/sync',
    async (request, reply) => {
      const { sessionIds } = request.body;
      if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
        return reply.status(400).send(fail('sessionIds must be a non-empty array'));
      }

      const db = app.db;
      const result = await syncSessions(
        db,
        request.params.projectId,
        request.user.userId,
        sessionIds,
      );

      return reply.status(201).send(ok(result));
    },
  );
};
