import type { FastifyPluginAsync } from 'fastify';
import { ok } from '../../lib/api-response.js';
import * as teamService from './team.service.js';
import { createTeamSchema, updateTeamSchema, addMemberSchema } from './team.schema.js';

export const teamRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.post<{ Body: unknown }>('/teams', async (request, reply) => {
    const input = createTeamSchema.parse(request.body);
    const team = await teamService.createTeam(app.db, input, request.user.userId);
    return reply.status(201).send(ok(team));
  });

  app.get('/teams', async (request, reply) => {
    const teams = await teamService.getTeamsByUser(app.db, request.user.userId);
    return reply.send(ok(teams));
  });

  app.get<{ Params: { teamId: string } }>('/teams/:teamId', async (request, reply) => {
    const team = await teamService.getTeam(app.db, request.params.teamId, request.user.userId);
    return reply.send(ok(team));
  });

  app.patch<{ Params: { teamId: string }; Body: unknown }>(
    '/teams/:teamId',
    async (request, reply) => {
      const input = updateTeamSchema.parse(request.body);
      const team = await teamService.updateTeam(
        app.db,
        request.params.teamId,
        request.user.userId,
        input,
      );
      return reply.send(ok(team));
    },
  );

  app.get<{ Params: { teamId: string } }>('/teams/:teamId/members', async (request, reply) => {
    const members = await teamService.getTeamMembers(
      app.db,
      request.params.teamId,
      request.user.userId,
    );
    return reply.send(ok(members));
  });

  app.post<{ Params: { teamId: string }; Body: unknown }>(
    '/teams/:teamId/members',
    async (request, reply) => {
      const input = addMemberSchema.parse(request.body);
      await teamService.addMember(
        app.db,
        request.params.teamId,
        request.user.userId,
        input.userId,
        input.role,
      );
      return reply.status(201).send(ok({ added: true }));
    },
  );

  app.delete<{ Params: { teamId: string; userId: string } }>(
    '/teams/:teamId/members/:userId',
    async (request, reply) => {
      await teamService.removeMember(
        app.db,
        request.params.teamId,
        request.user.userId,
        request.params.userId,
      );
      return reply.send(ok({ removed: true }));
    },
  );
};
