import type { FastifyPluginAsync } from 'fastify';
import { loginSchema, upgradeSchema, updatePlanSchema } from './auth.schema.js';
import {
  findOrCreateByEmail,
  findUserById,
  createAutoUser,
  upgradeAutoUser,
  updateUserPlan,
} from './auth.service.js';
import { ok, fail } from '../../lib/api-response.js';

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ');
      return reply.status(400).send(fail(message));
    }

    const user = await findOrCreateByEmail(app.db, parsed.data);

    const token = app.jwt.sign(
      { userId: user.id, email: user.email },
      { expiresIn: app.env.JWT_EXPIRES_IN },
    );

    return reply.send(ok({ token, user }));
  });

  app.post('/auto', async (_request, reply) => {
    const user = await createAutoUser(app.db);

    const token = app.jwt.sign(
      { userId: user.id, email: user.email },
      { expiresIn: app.env.JWT_EXPIRES_IN },
    );

    return reply.send(ok({ token, user }));
  });

  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = await findUserById(app.db, request.user.userId);
    if (!user) {
      return reply.status(404).send(fail('User not found'));
    }
    return reply.send(ok(user));
  });

  app.post('/refresh', { preHandler: [app.authenticate] }, async (request, reply) => {
    const token = app.jwt.sign(
      { userId: request.user.userId, email: request.user.email },
      { expiresIn: app.env.JWT_EXPIRES_IN },
    );
    return reply.send(ok({ token }));
  });

  app.put('/me/plan', { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = updatePlanSchema.safeParse(request.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ');
      return reply.status(400).send(fail(message));
    }

    const user = await updateUserPlan(app.db, request.user.userId, parsed.data.claudePlan);
    return reply.send(ok(user));
  });

  app.post('/upgrade', { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = upgradeSchema.safeParse(request.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ');
      return reply.status(400).send(fail(message));
    }

    const user = await upgradeAutoUser(app.db, parsed.data);

    const token = app.jwt.sign(
      { userId: user.id, email: user.email },
      { expiresIn: app.env.JWT_EXPIRES_IN },
    );

    return reply.send(ok({ token, user }));
  });
};
