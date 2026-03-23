import type { FastifyPluginAsync } from 'fastify';
import {
  loginSchema,
  identifySchema,
  identifySelectSchema,
  updatePlanSchema,
  updateApiKeySchema,
  updateSupabaseTokenSchema,
} from './auth.schema.js';
import {
  findOrCreateByEmail,
  findOrCreateByName,
  findUserById,
  updateUserPlan,
  updateApiKey,
  deleteApiKey,
  saveSupabaseToken,
  deleteSupabaseToken,
} from './auth.service.js';
import { ok, fail } from '../../lib/api-response.js';

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ');
      return reply.status(400).send(fail(message));
    }

    const user = await findOrCreateByEmail(app.localDb, parsed.data);

    const token = app.jwt.sign(
      { userId: user.id, email: user.email },
      { expiresIn: app.env.JWT_EXPIRES_IN },
    );

    return reply.send(ok({ token, user }));
  });

  app.post('/identify', async (request, reply) => {
    const parsed = identifySchema.safeParse(request.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ');
      return reply.status(400).send(fail(message));
    }

    const result = await findOrCreateByName(app.localDb, parsed.data.name);

    const singleUser = result.users.length === 1 ? result.users[0] : undefined;
    if (singleUser) {
      const token = app.jwt.sign(
        { userId: singleUser.id, email: singleUser.email },
        { expiresIn: app.env.JWT_EXPIRES_IN },
      );
      return reply.send(ok({ token, user: singleUser }));
    }

    // Multiple users with same name — return list for selection
    return reply.send(ok({ users: result.users, needsSelection: true }));
  });

  app.post('/identify/select', async (request, reply) => {
    const parsed = identifySelectSchema.safeParse(request.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ');
      return reply.status(400).send(fail(message));
    }

    const user = await findUserById(app.localDb, parsed.data.userId);
    if (!user) {
      return reply.status(404).send(fail('User not found'));
    }

    const token = app.jwt.sign(
      { userId: user.id, email: user.email },
      { expiresIn: app.env.JWT_EXPIRES_IN },
    );
    return reply.send(ok({ token, user }));
  });

  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = await findUserById(app.localDb, request.user.userId);
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

    const user = await updateUserPlan(app.localDb, request.user.userId, parsed.data.claudePlan);
    return reply.send(ok(user));
  });

  app.put('/me/api-key', { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = updateApiKeySchema.safeParse(request.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ');
      return reply.status(400).send(fail(message));
    }

    const user = await updateApiKey(app.localDb, request.user.userId, parsed.data.apiKey);
    return reply.send(ok(user));
  });

  app.delete('/me/api-key', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = await deleteApiKey(app.localDb, request.user.userId);
    return reply.send(ok(user));
  });

  app.put('/me/supabase-token', { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = updateSupabaseTokenSchema.safeParse(request.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ');
      return reply.status(400).send(fail(message));
    }

    const user = await saveSupabaseToken(
      app.localDb,
      request.user.userId,
      parsed.data.token,
      app.env.JWT_SECRET,
    );
    return reply.send(ok(user));
  });

  app.delete('/me/supabase-token', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = await deleteSupabaseToken(app.localDb, request.user.userId);
    return reply.send(ok(user));
  });
};
