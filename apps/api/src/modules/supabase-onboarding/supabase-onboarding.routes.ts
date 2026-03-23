import type { FastifyPluginAsync } from 'fastify';
import { ok, fail, failWithData } from '../../lib/api-response.js';
import { autoSetupExistingSchema, autoSetupNewSchema } from './supabase-onboarding.schema.js';
import {
  getProjectsForUser,
  getOrganizationsForUser,
  autoSetupExisting,
  createAndSetup,
} from './supabase-onboarding.service.js';

export const supabaseOnboardingRoutes: FastifyPluginAsync = async (app) => {
  app.get('/supabase/projects', { preHandler: [app.authenticate] }, async (request, reply) => {
    const projects = await getProjectsForUser(app.localDb, request.user.userId, app.env.JWT_SECRET);
    return reply.send(ok(projects));
  });

  app.get('/supabase/organizations', { preHandler: [app.authenticate] }, async (request, reply) => {
    const orgs = await getOrganizationsForUser(
      app.localDb,
      request.user.userId,
      app.env.JWT_SECRET,
    );
    return reply.send(ok(orgs));
  });

  app.post('/supabase/auto-setup', { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = autoSetupExistingSchema.safeParse(request.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ');
      return reply.status(400).send(fail(message));
    }

    const result = await autoSetupExisting(
      app.localDb,
      request.user.userId,
      app.env.JWT_SECRET,
      parsed.data,
    );
    return reply.send(ok(result));
  });

  app.post(
    '/supabase/create-and-setup',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const parsed = autoSetupNewSchema.safeParse(request.body);
      if (!parsed.success) {
        const message = parsed.error.errors.map((e) => e.message).join(', ');
        return reply.status(400).send(fail(message));
      }

      const result = await createAndSetup(
        app.localDb,
        request.user.userId,
        app.env.JWT_SECRET,
        parsed.data,
      );

      if ('recovered' in result) {
        return reply
          .status(504)
          .send(
            failWithData(result.error, { projectRef: result.projectRef, region: result.region }),
          );
      }

      return reply.send(ok(result));
    },
  );
};
