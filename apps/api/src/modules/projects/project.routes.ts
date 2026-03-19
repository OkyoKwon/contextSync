import type { FastifyPluginAsync } from 'fastify';
import { ok } from '../../lib/api-response.js';
import * as projectService from './project.service.js';
import { createProjectSchema, updateProjectSchema } from './project.schema.js';

export const projectRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.post<{ Params: { teamId: string }; Body: unknown }>(
    '/teams/:teamId/projects',
    async (request, reply) => {
      const input = createProjectSchema.parse(request.body);
      const project = await projectService.createProject(
        app.db,
        request.params.teamId,
        request.user.userId,
        input,
      );
      return reply.status(201).send(ok(project));
    },
  );

  app.get<{ Params: { teamId: string } }>('/teams/:teamId/projects', async (request, reply) => {
    const projects = await projectService.getProjectsByTeam(
      app.db,
      request.params.teamId,
      request.user.userId,
    );
    return reply.send(ok(projects));
  });

  app.get<{ Params: { projectId: string } }>('/projects/:projectId', async (request, reply) => {
    const project = await projectService.getProject(
      app.db,
      request.params.projectId,
      request.user.userId,
    );
    return reply.send(ok(project));
  });

  app.patch<{ Params: { projectId: string }; Body: unknown }>(
    '/projects/:projectId',
    async (request, reply) => {
      const input = updateProjectSchema.parse(request.body);
      const project = await projectService.updateProject(
        app.db,
        request.params.projectId,
        request.user.userId,
        input,
      );
      return reply.send(ok(project));
    },
  );
};
