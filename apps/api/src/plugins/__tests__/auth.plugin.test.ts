import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@fastify/jwt', () => ({
  default: vi.fn(),
}));

import { registerJwt } from '../auth.plugin.js';

beforeEach(() => {
  vi.clearAllMocks();
});

function createMockApp() {
  const decorators: Record<string, unknown> = {};
  return {
    register: vi.fn().mockResolvedValue(undefined),
    decorate: vi.fn((name: string, handler: unknown) => {
      decorators[name] = handler;
    }),
    _decorators: decorators,
  } as any;
}

function createMockRequest(jwtVerifyResult?: unknown, shouldThrow = false) {
  return {
    jwtVerify: shouldThrow
      ? vi.fn().mockRejectedValue(new Error('Invalid token'))
      : vi.fn().mockResolvedValue(jwtVerifyResult ?? { userId: 'u1', email: 'a@b.com' }),
  } as any;
}

function createMockReply() {
  const reply: Record<string, ReturnType<typeof vi.fn>> = {};
  reply.status = vi.fn().mockReturnValue(reply);
  reply.send = vi.fn().mockReturnValue(reply);
  return reply as any;
}

describe('registerJwt', () => {
  it('should register jwt plugin and decorate app with authenticate and authenticateIdentified', async () => {
    const app = createMockApp();

    await registerJwt(app, 'test-secret');

    expect(app.register).toHaveBeenCalled();
    expect(app.decorate).toHaveBeenCalledWith('authenticate', expect.any(Function));
    expect(app.decorate).toHaveBeenCalledWith('authenticateIdentified', expect.any(Function));
  });

  describe('authenticate', () => {
    it('should call jwtVerify on request', async () => {
      const app = createMockApp();
      await registerJwt(app, 'secret');

      const authenticate = app._decorators['authenticate'] as (...args: unknown[]) => Promise<void>;
      const request = createMockRequest();
      const reply = createMockReply();

      await authenticate(request, reply);

      expect(request.jwtVerify).toHaveBeenCalled();
    });

    it('should return 401 when jwtVerify fails', async () => {
      const app = createMockApp();
      await registerJwt(app, 'secret');

      const authenticate = app._decorators['authenticate'] as (...args: unknown[]) => Promise<void>;
      const request = createMockRequest(undefined, true);
      const reply = createMockReply();

      await authenticate(request, reply);

      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({
        success: false,
        data: null,
        error: 'Unauthorized',
      });
    });
  });

  describe('authenticateIdentified', () => {
    it('should call jwtVerify on request', async () => {
      const app = createMockApp();
      await registerJwt(app, 'secret');

      const authenticateIdentified = app._decorators['authenticateIdentified'] as (
        ...args: unknown[]
      ) => Promise<void>;
      const request = createMockRequest();
      const reply = createMockReply();

      await authenticateIdentified(request, reply);

      expect(request.jwtVerify).toHaveBeenCalled();
    });

    it('should return 401 when jwtVerify fails', async () => {
      const app = createMockApp();
      await registerJwt(app, 'secret');

      const authenticateIdentified = app._decorators['authenticateIdentified'] as (
        ...args: unknown[]
      ) => Promise<void>;
      const request = createMockRequest(undefined, true);
      const reply = createMockReply();

      await authenticateIdentified(request, reply);

      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({
        success: false,
        data: null,
        error: 'Unauthorized',
      });
    });

    it('should not send 401 when jwtVerify succeeds', async () => {
      const app = createMockApp();
      await registerJwt(app, 'secret');

      const authenticateIdentified = app._decorators['authenticateIdentified'] as (
        ...args: unknown[]
      ) => Promise<void>;
      const request = createMockRequest({ userId: 'user-1', email: 'test@test.com' });
      const reply = createMockReply();

      await authenticateIdentified(request, reply);

      expect(reply.status).not.toHaveBeenCalled();
      expect(reply.send).not.toHaveBeenCalled();
    });
  });
});
