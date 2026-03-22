import fjwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { fail } from '../lib/api-response.js';

export interface JwtPayload {
  readonly userId: string;
  readonly email: string;
}

export async function registerJwt(app: FastifyInstance, secret: string): Promise<void> {
  await app.register(fjwt, { secret });

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ success: false, data: null, error: 'Unauthorized' });
    }
  });

  app.decorate('authenticateIdentified', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ success: false, data: null, error: 'Unauthorized' });
    }

    const user = await app.db
      .selectFrom('users')
      .select('is_auto')
      .where('id', '=', request.user.userId)
      .executeTakeFirst();

    if (user?.is_auto) {
      return reply.status(403).send(fail('Team features require account upgrade'));
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticateIdentified: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
