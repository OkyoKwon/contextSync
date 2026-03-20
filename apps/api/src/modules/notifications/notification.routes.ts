import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ok } from '../../lib/api-response.js';
import { getUserNotificationSettings, updateUserNotificationSettings } from './notification.service.js';

const notificationSettingsSchema = z.object({
  email: z.boolean(),
  slack: z.boolean(),
  slackWebhookUrl: z.string().url().nullable(),
  severityThreshold: z.enum(['info', 'warning', 'critical']),
  teamEvents: z.boolean().default(true),
});

export const notificationRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get('/users/me/notification-settings', async (request, reply) => {
    const settings = await getUserNotificationSettings(app.db, request.user.userId);
    return reply.send(ok(settings));
  });

  app.put<{ Body: unknown }>('/users/me/notification-settings', async (request, reply) => {
    const input = notificationSettingsSchema.parse(request.body);
    const settings = await updateUserNotificationSettings(app.db, request.user.userId, input);
    return reply.send(ok(settings));
  });
};
