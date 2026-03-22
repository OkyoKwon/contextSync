import type { FastifyPluginAsync } from 'fastify';
import { ok } from '../../lib/api-response.js';
import * as adminService from './admin.service.js';

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get('/admin/status', async (request, reply) => {
    const user = await getUserWithRole(app.db, request.user.userId);
    adminService.assertAdmin(user.role);

    const status = await adminService.getAdminStatus(app.db);
    return reply.send(ok(status));
  });

  app.post('/admin/migrations/run', async (request, reply) => {
    const user = await getUserWithRole(app.db, request.user.userId);
    adminService.assertOwnerRole(user.role);

    const result = await adminService.runMigrations(app.db);
    return reply.send(ok(result));
  });

  app.get('/admin/config', async (request, reply) => {
    const user = await getUserWithRole(app.db, request.user.userId);
    adminService.assertAdmin(user.role);

    const config = adminService.getAdminConfig(app.env);
    return reply.send(ok(config));
  });
};

async function getUserWithRole(
  db: import('../../database/client.js').Db,
  userId: string,
): Promise<{ readonly role: string }> {
  const user = await db
    .selectFrom('users')
    .select('role')
    .where('id', '=', userId)
    .executeTakeFirst();

  if (!user) {
    throw new Error('User not found');
  }
  return user;
}
