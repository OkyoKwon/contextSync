import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { findOrCreateUser } from './auth.service.js';
import { ok, fail } from '../../lib/api-response.js';

const devLoginSchema = z.object({
  name: z.string().min(1).default('Dev User'),
  email: z.string().email().default('dev@contextsync.local'),
});

export const devAuthRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: unknown }>('/dev-login', async (request, reply) => {
    if (app.env.DEV_AUTH_MODE !== 'true') {
      return reply.status(404).send(fail('Not found'));
    }

    const parsed = devLoginSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send(fail('Invalid input'));
    }

    const { name, email } = parsed.data;

    try {
      const user = await findOrCreateUser(app.db, {
        githubId: 0,
        email,
        name,
        avatarUrl: '',
      });

      const token = app.jwt.sign(
        { userId: user.id, email: user.email },
        { expiresIn: app.env.JWT_EXPIRES_IN },
      );

      return reply.send(ok({ token, user }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Dev login failed';
      return reply.status(500).send(fail(message));
    }
  });
};
