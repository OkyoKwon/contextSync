import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../test-helpers/create-test-app.js';
import {
  authHeader,
  DEFAULT_TEST_USER,
  generateExpiredToken,
} from '../../../test-helpers/auth-helper.js';

// Mock the auth service at module level
vi.mock('../auth.service.js', () => ({
  findOrCreateByEmail: vi.fn(),
  findOrCreateByName: vi.fn(),
  findUserById: vi.fn(),
  updateUserPlan: vi.fn(),
  updateApiKey: vi.fn(),
  deleteApiKey: vi.fn(),
  saveSupabaseToken: vi.fn(),
  deleteSupabaseToken: vi.fn(),
}));

// Must import after vi.mock
import * as authService from '../auth.service.js';

const mockFindOrCreateByEmail = vi.mocked(authService.findOrCreateByEmail);
const mockFindOrCreateByName = vi.mocked(authService.findOrCreateByName);
const mockFindUserById = vi.mocked(authService.findUserById);
const mockUpdateUserPlan = vi.mocked(authService.updateUserPlan);
const mockUpdateApiKey = vi.mocked(authService.updateApiKey);
const mockDeleteApiKey = vi.mocked(authService.deleteApiKey);
const mockSaveSupabaseToken = vi.mocked(authService.saveSupabaseToken);
const mockDeleteSupabaseToken = vi.mocked(authService.deleteSupabaseToken);

const MOCK_USER = {
  id: DEFAULT_TEST_USER.userId,
  githubId: null,
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  role: 'user' as const,
  claudePlan: 'free' as const,
  hasAnthropicApiKey: false,
  hasSupabaseToken: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Auth Routes Integration', () => {
  // --- POST /api/auth/login ---
  describe('POST /api/auth/login', () => {
    it('should return 200 with token and user on valid login', async () => {
      mockFindOrCreateByEmail.mockResolvedValue(MOCK_USER);

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { name: 'Test User', email: 'test@example.com' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.token).toBeDefined();
      expect(body.data.user.email).toBe('test@example.com');
      expect(body.error).toBeNull();
    });

    it('should return 400 when name is empty', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { name: '', email: 'test@example.com' },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('should return 400 when email is invalid', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { name: 'Test', email: 'not-an-email' },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
    });

    it('should return 400 when body is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 when name exceeds max length', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { name: 'a'.repeat(256), email: 'test@example.com' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // --- POST /api/auth/identify ---
  describe('POST /api/auth/identify', () => {
    it('should return token when single user found', async () => {
      mockFindOrCreateByName.mockResolvedValue({
        users: [MOCK_USER],
        created: false,
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/identify',
        payload: { name: 'Test User' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.token).toBeDefined();
      expect(body.data.user.name).toBe('Test User');
    });

    it('should return users list when multiple users found', async () => {
      const secondUser = { ...MOCK_USER, id: 'user-2', email: 'test2@example.com' };
      mockFindOrCreateByName.mockResolvedValue({
        users: [MOCK_USER, secondUser],
        created: false,
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/identify',
        payload: { name: 'Test User' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.needsSelection).toBe(true);
      expect(body.data.users).toHaveLength(2);
    });

    it('should return 400 when name is empty', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/identify',
        payload: { name: '' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 when name exceeds 100 characters', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/identify',
        payload: { name: 'x'.repeat(101) },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // --- POST /api/auth/identify/select ---
  describe('POST /api/auth/identify/select', () => {
    it('should return token for valid userId', async () => {
      mockFindUserById.mockResolvedValue(MOCK_USER);

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/identify/select',
        payload: { userId: DEFAULT_TEST_USER.userId },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.token).toBeDefined();
      expect(body.data.user.id).toBe(DEFAULT_TEST_USER.userId);
    });

    it('should return 404 when user not found', async () => {
      mockFindUserById.mockResolvedValue(null);

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/identify/select',
        payload: { userId: '00000000-0000-0000-0000-000000000099' },
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.success).toBe(false);
    });

    it('should return 400 when userId is not a valid UUID', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/identify/select',
        payload: { userId: 'not-a-uuid' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // --- GET /api/auth/me ---
  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      mockFindUserById.mockResolvedValue(MOCK_USER);

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(DEFAULT_TEST_USER.userId);
    });

    it('should return 401 without auth token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
      });

      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 401 with expired token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: `Bearer ${await generateExpiredToken()}` },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 with malformed token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: 'Bearer invalid.token.here' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should return 404 when user no longer exists', async () => {
      mockFindUserById.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // --- POST /api/auth/refresh ---
  describe('POST /api/auth/refresh', () => {
    it('should return a new token when authenticated', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.token).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  // --- PUT /api/auth/me/plan ---
  describe('PUT /api/auth/me/plan', () => {
    it('should update plan for authenticated user', async () => {
      const updatedUser = { ...MOCK_USER, claudePlan: 'pro' as const };
      mockUpdateUserPlan.mockResolvedValue(updatedUser);

      const res = await app.inject({
        method: 'PUT',
        url: '/api/auth/me/plan',
        headers: { authorization: await authHeader() },
        payload: { claudePlan: 'pro' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.claudePlan).toBe('pro');
    });

    it('should return 400 with invalid plan value', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/auth/me/plan',
        headers: { authorization: await authHeader() },
        payload: { claudePlan: 'invalid_plan' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/auth/me/plan',
        payload: { claudePlan: 'pro' },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  // --- PUT /api/auth/me/api-key ---
  describe('PUT /api/auth/me/api-key', () => {
    it('should update API key for authenticated user', async () => {
      const updatedUser = { ...MOCK_USER, hasAnthropicApiKey: true };
      mockUpdateApiKey.mockResolvedValue(updatedUser);

      const res = await app.inject({
        method: 'PUT',
        url: '/api/auth/me/api-key',
        headers: { authorization: await authHeader() },
        payload: { apiKey: 'sk-ant-api-test-key' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.hasAnthropicApiKey).toBe(true);
    });

    it('should return 400 with empty API key', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/auth/me/api-key',
        headers: { authorization: await authHeader() },
        payload: { apiKey: '' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // --- DELETE /api/auth/me/api-key ---
  describe('DELETE /api/auth/me/api-key', () => {
    it('should delete API key for authenticated user', async () => {
      const updatedUser = { ...MOCK_USER, hasAnthropicApiKey: false };
      mockDeleteApiKey.mockResolvedValue(updatedUser);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/auth/me/api-key',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.hasAnthropicApiKey).toBe(false);
    });

    it('should return 401 without auth token', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/auth/me/api-key',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  // --- PUT /api/auth/me/supabase-token ---
  describe('PUT /api/auth/me/supabase-token', () => {
    it('should save supabase token for authenticated user', async () => {
      const updatedUser = { ...MOCK_USER, hasSupabaseToken: true };
      mockSaveSupabaseToken.mockResolvedValue(updatedUser);

      const res = await app.inject({
        method: 'PUT',
        url: '/api/auth/me/supabase-token',
        headers: { authorization: await authHeader() },
        payload: { token: 'sbp_test-supabase-token' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.hasSupabaseToken).toBe(true);
    });

    it('should return 400 with empty token', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/auth/me/supabase-token',
        headers: { authorization: await authHeader() },
        payload: { token: '' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // --- DELETE /api/auth/me/supabase-token ---
  describe('DELETE /api/auth/me/supabase-token', () => {
    it('should delete supabase token for authenticated user', async () => {
      const updatedUser = { ...MOCK_USER, hasSupabaseToken: false };
      mockDeleteSupabaseToken.mockResolvedValue(updatedUser);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/auth/me/supabase-token',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
    });
  });
});
