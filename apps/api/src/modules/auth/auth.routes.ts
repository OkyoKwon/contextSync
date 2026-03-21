import type { FastifyPluginAsync } from 'fastify';
import {
  buildGitHubAuthUrl,
  exchangeCodeForToken,
  fetchGitHubProfile,
} from './github-oauth.client.js';
import { findOrCreateUser, findUserById } from './auth.service.js';
import { ok, fail } from '../../lib/api-response.js';

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.get('/github', async (_request, reply) => {
    const callbackUrl =
      app.env.NODE_ENV === 'production'
        ? `${app.env.FRONTEND_URL.replace(/\/$/, '').replace(/:\d+$/, '')}/api/auth/github/callback`
        : `http://${app.env.HOST === '0.0.0.0' ? 'localhost' : app.env.HOST}:${app.env.PORT}/api/auth/github/callback`;
    const authUrl = buildGitHubAuthUrl(app.env.GITHUB_CLIENT_ID, callbackUrl);
    reply.redirect(authUrl);
  });

  app.get<{ Querystring: { code?: string } }>('/github/callback', async (request, reply) => {
    const { code } = request.query;
    if (!code) {
      return reply.redirect(`${app.env.FRONTEND_URL}/login?error=missing_code`);
    }

    try {
      const accessToken = await exchangeCodeForToken(
        app.env.GITHUB_CLIENT_ID,
        app.env.GITHUB_CLIENT_SECRET,
        code,
      );

      const profile = await fetchGitHubProfile(accessToken);
      const user = await findOrCreateUser(app.db, profile);

      const token = app.jwt.sign(
        { userId: user.id, email: user.email },
        { expiresIn: app.env.JWT_EXPIRES_IN },
      );

      const params = new URLSearchParams({ token, user: JSON.stringify(user) });
      return reply.redirect(`${app.env.FRONTEND_URL}/auth/callback?${params.toString()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth failed';
      return reply.redirect(`${app.env.FRONTEND_URL}/login?error=${encodeURIComponent(message)}`);
    }
  });

  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = await findUserById(app.db, request.user.userId);
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
};
