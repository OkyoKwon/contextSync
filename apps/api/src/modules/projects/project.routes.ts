import type { FastifyPluginAsync } from 'fastify';
import { ok } from '../../lib/api-response.js';
import * as projectService from './project.service.js';
import {
  createProjectSchema,
  updateProjectSchema,
  setMyDirectorySchema,
} from './project.schema.js';
import { addCollaboratorSchema } from './collaborator.schema.js';
import { NotFoundError } from '../../plugins/error-handler.plugin.js';

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

  app.post<{ Params: { projectId: string }; Body: unknown }>(
    '/projects/:projectId/collaborators',
    async (request, reply) => {
      const { email, role } = addCollaboratorSchema.parse(request.body);

      const targetUser = await app.db
        .selectFrom('users')
        .select('id')
        .where('email', '=', email)
        .executeTakeFirst();

      if (!targetUser) throw new NotFoundError('User');

      await projectService.addCollaborator(
        app.db,
        request.params.projectId,
        request.user.userId,
        targetUser.id,
        role,
      );
      return reply.status(201).send(ok(null));
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
