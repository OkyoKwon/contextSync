import type { FastifyPluginAsync } from 'fastify';
import { ok, fail } from '../../lib/api-response.js';
import { autoSetupExistingSchema, autoSetupNewSchema } from './supabase-onboarding.schema.js';
import {
  getProjectsForUser,
  getOrganizationsForUser,
  autoSetupExisting,
  createAndSetup,
} from './supabase-onboarding.service.js';

export const supabaseOnboardingRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/projects/:projectId/supabase/projects',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const projects = await getProjectsForUser(app.db, request.user.userId, app.env.JWT_SECRET);
      return reply.send(ok(projects));
    },
  );

  app.get(
    '/projects/:projectId/supabase/organizations',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const orgs = await getOrganizationsForUser(app.db, request.user.userId, app.env.JWT_SECRET);
      return reply.send(ok(orgs));
    },
  );

  app.post(
    '/projects/:projectId/supabase/auto-setup',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const parsed = autoSetupExistingSchema.safeParse(request.body);
      if (!parsed.success) {
        const message = parsed.error.errors.map((e) => e.message).join(', ');
        return reply.status(400).send(fail(message));
      }

      const config = await autoSetupExisting(
        app.db,
        request.user.userId,
        projectId,
        app.env.JWT_SECRET,
        parsed.data,
      );
      return reply.send(ok(config));
    },
  );

  app.post(
    '/projects/:projectId/supabase/create-and-setup',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const parsed = autoSetupNewSchema.safeParse(request.body);
      if (!parsed.success) {
        const message = parsed.error.errors.map((e) => e.message).join(', ');
        return reply.status(400).send(fail(message));
      }

      const config = await createAndSetup(
        app.db,
        request.user.userId,
        projectId,
        app.env.JWT_SECRET,
        parsed.data,
      );
      return reply.send(ok(config));
    },
  );
};
