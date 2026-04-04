/**
 * Test helper: generates JWT tokens for integration tests.
 * Uses @fastify/jwt (same as production) instead of jsonwebtoken.
 */
import Fastify from 'fastify';
import fjwt from '@fastify/jwt';
import { TEST_JWT_SECRET } from './create-test-app.js';

export interface TestUser {
  readonly userId: string;
  readonly email: string;
}

export const DEFAULT_TEST_USER: TestUser = {
  userId: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
};

export const SECOND_TEST_USER: TestUser = {
  userId: '00000000-0000-0000-0000-000000000002',
  email: 'other@example.com',
};

// Lightweight Fastify instance just for signing tokens
let signer: Awaited<ReturnType<typeof createSigner>> | null = null;

async function createSigner() {
  const app = Fastify({ logger: false });
  await app.register(fjwt, { secret: TEST_JWT_SECRET });
  await app.ready();
  return app;
}

async function getSigner() {
  if (!signer) {
    signer = await createSigner();
  }
  return signer;
}

/**
 * Generates a valid JWT token for testing authenticated endpoints.
 */
export async function generateTestToken(user: TestUser = DEFAULT_TEST_USER): Promise<string> {
  const app = await getSigner();
  return app.jwt.sign({ userId: user.userId, email: user.email }, { expiresIn: '1h' });
}

/**
 * Returns the Authorization header value for a test user.
 */
export async function authHeader(user: TestUser = DEFAULT_TEST_USER): Promise<string> {
  return `Bearer ${await generateTestToken(user)}`;
}

/**
 * Generates an expired JWT token for testing token expiration handling.
 * Uses expiresIn: 0 and iat in the past to ensure the token is expired.
 */
export async function generateExpiredToken(user: TestUser = DEFAULT_TEST_USER): Promise<string> {
  const app = await getSigner();
  const pastIat = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
  return app.jwt.sign(
    { userId: user.userId, email: user.email, iat: pastIat },
    { expiresIn: 1 }, // 1 second from iat (which is 1hr ago) → already expired
  );
}
