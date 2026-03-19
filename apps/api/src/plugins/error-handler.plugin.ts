import type { FastifyInstance, FastifyError } from 'fastify';
import { fail } from '../lib/api-response.js';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    const statusCode = error instanceof AppError
      ? error.statusCode
      : error.statusCode ?? 500;

    if (statusCode >= 500) {
      app.log.error(error);
    }

    const message = statusCode >= 500
      ? 'Internal server error'
      : error.message;

    reply.status(statusCode).send(fail(message));
  });
}
