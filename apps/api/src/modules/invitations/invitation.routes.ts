import type { FastifyPluginAsync } from 'fastify';
import { ok } from '../../lib/api-response.js';
import * as invitationService from './invitation.service.js';
import { createInvitationSchema, respondInvitationSchema } from './invitation.schema.js';

export const invitationRoutes: FastifyPluginAsync = async (app) => {
  // --- Public endpoint (no auth) ---

  app.get<{ Params: { token: string } }>('/invitations/verify/:token', async (request, reply) => {
    const { valid } = await invitationService.verifyToken(app.db, request.params.token);

    if (!valid) {
      return reply.redirect(`${app.env.FRONTEND_URL}/invitations/expired`);
    }

    return reply.redirect(
      `${app.env.FRONTEND_URL}/invitations/accept?token=${request.params.token}`,
    );
  });

  // --- Authenticated endpoints ---

  app.register(async (authenticated) => {
    authenticated.addHook('preHandler', authenticated.authenticate);

    // Create invitation for a project (requires identified account)
    authenticated.post<{ Params: { projectId: string }; Body: unknown }>(
      '/projects/:projectId/invitations',
      { preHandler: [authenticated.authenticateIdentified] },
      async (request, reply) => {
        const input = createInvitationSchema.parse(request.body);
        const invitation = await invitationService.createInvitation(
          app.db,
          request.params.projectId,
          request.user.userId,
          input,
          app.env,
        );
        return reply.status(201).send(ok(invitation));
      },
    );

    // List pending invitations for a project
    authenticated.get<{ Params: { projectId: string } }>(
      '/projects/:projectId/invitations',
      async (request, reply) => {
        const invitations = await invitationService.getProjectInvitations(
          app.db,
          request.params.projectId,
          request.user.userId,
        );
        return reply.send(ok(invitations));
      },
    );

    // Cancel an invitation
    authenticated.delete<{ Params: { invitationId: string } }>(
      '/invitations/:invitationId',
      async (request, reply) => {
        await invitationService.cancelInvitation(
          app.db,
          request.params.invitationId,
          request.user.userId,
        );
        return reply.send(ok(null));
      },
    );

    // My pending invitations
    authenticated.get('/invitations/mine', async (request, reply) => {
      const invitations = await invitationService.getMyPendingInvitations(
        app.db,
        request.user.email,
      );
      return reply.send(ok(invitations));
    });

    // Respond to invitation (accept/decline)
    authenticated.post<{ Body: unknown }>('/invitations/respond', async (request, reply) => {
      const { token, action } = respondInvitationSchema.parse(request.body);
      const invitation = await invitationService.respondToInvitation(
        app.db,
        token,
        request.user.userId,
        request.user.email,
        action,
      );
      return reply.send(ok(invitation));
    });
  });
};
