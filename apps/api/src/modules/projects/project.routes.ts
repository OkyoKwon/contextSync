import type { FastifyPluginAsync } from 'fastify';
import { ok } from '../../lib/api-response.js';
import * as projectService from './project.service.js';
import {
  createProjectSchema,
  updateProjectSchema,
  setMyDirectorySchema,
} from './project.schema.js';

export const projectRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  // Project CRUD
  app.post('/projects', async (request, reply) => {
    const input = createProjectSchema.parse(request.body);
    const project = await projectService.createProject(app.db, request.user.userId, input);
    return reply.status(201).send(ok(project));
  });

  app.get('/projects', async (request, reply) => {
    const projects = await projectService.getProjects(app.db, request.user.userId);
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

  app.delete<{ Params: { projectId: string } }>('/projects/:projectId', async (request, reply) => {
    await projectService.deleteProject(app.db, request.params.projectId, request.user.userId);
    return reply.send(ok(null));
  });

  // My directory
  app.patch<{ Params: { projectId: string }; Body: unknown }>(
    '/projects/:projectId/my-directory',
    async (request, reply) => {
      const { localDirectory } = setMyDirectorySchema.parse(request.body);
      await projectService.setMyDirectory(
        app.db,
        request.params.projectId,
        request.user.userId,
        localDirectory,
      );
      return reply.send(ok(null));
    },
  );

  // Collaborator routes
  app.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/collaborators',
    async (request, reply) => {
      const collaborators = await projectService.getCollaborators(
        app.db,
        request.params.projectId,
        request.user.userId,
      );
      return reply.send(ok(collaborators));
    },
  );

  app.delete<{ Params: { projectId: string; userId: string } }>(
    '/projects/:projectId/collaborators/:userId',
    async (request, reply) => {
      await projectService.removeCollaborator(
        app.db,
        request.params.projectId,
        request.user.userId,
        request.params.userId,
      );
      return reply.send(ok(null));
    },
  );
};
