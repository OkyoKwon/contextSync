import type { FastifyPluginAsync } from 'fastify';
import { ok } from '../../lib/api-response.js';
import { testConnectionSchema, saveDbConfigSchema } from './db-config.schema.js';
import * as dbConfigService from './db-config.service.js';
import * as dataMigrationService from './data-migration.service.js';
import { assertPermission } from '../projects/permission.helper.js';

export const dbConfigRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  // Test connection (owner only)
  app.post<{ Params: { projectId: string }; Body: unknown }>(
    '/projects/:projectId/db-config/test',
    async (request, reply) => {
      const input = testConnectionSchema.parse(request.body);
      const result = await dbConfigService.testConnection(input.connectionUrl, input.sslEnabled);
      return reply.send(ok(result));
    },
  );

  // Save config + run schema migrations (owner only)
  app.post<{ Params: { projectId: string }; Body: unknown }>(
    '/projects/:projectId/db-config',
    async (request, reply) => {
      const input = saveDbConfigSchema.parse(request.body);
      const config = await dbConfigService.saveConfig(
        app.db,
        request.params.projectId,
        request.user.userId,
        input.connectionUrl,
        input.provider,
        input.sslEnabled,
        app.env.JWT_SECRET,
      );
      return reply.status(201).send(ok(config));
    },
  );

  // Get current config (data:read)
  app.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/db-config',
    async (request, reply) => {
      const config = await dbConfigService.getConfig(
        app.db,
        request.params.projectId,
        request.user.userId,
        app.env.JWT_SECRET,
      );
      return reply.send(ok(config));
    },
  );

  // Delete config (owner only, returns to local)
  app.delete<{ Params: { projectId: string } }>(
    '/projects/:projectId/db-config',
    async (request, reply) => {
      await dbConfigService.deleteConfig(app.db, request.params.projectId, request.user.userId);
      return reply.send(ok({ deleted: true }));
    },
  );

  // Migration preview
  app.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/db-config/migrate/preview',
    async (request, reply) => {
      const preview = await dbConfigService.getMigrationPreview(
        app.db,
        request.params.projectId,
        request.user.userId,
      );
      return reply.send(ok(preview));
    },
  );

  // Start data migration
  app.post<{ Params: { projectId: string } }>(
    '/projects/:projectId/db-config/migrate',
    async (request, reply) => {
      const progress = await dataMigrationService.startMigration(
        app.db,
        request.params.projectId,
        request.user.userId,
        app.env.JWT_SECRET,
      );
      return reply.status(202).send(ok(progress));
    },
  );

  // Get migration progress (polling)
  app.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/db-config/migrate',
    async (request, reply) => {
      await assertPermission(app.db, request.params.projectId, request.user.userId, 'data:read');
      const progress = await dataMigrationService.getMigrationProgress(
        app.db,
        request.params.projectId,
      );
      return reply.send(ok(progress));
    },
  );
};
