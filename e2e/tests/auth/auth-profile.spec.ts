import { test, expect } from '../../fixtures/auth.fixture.js';
import { buildUser } from '../../helpers/test-data.js';

test.describe('Auth Profile & Token', () => {
  test('GET /me returns current user', async ({ apiClient, testUser }) => {
    const raw = await apiClient.fetchRaw('GET', '/auth/me', undefined, testUser.token);

    expect(raw.status).toBe(200);
    expect(raw.body.success).toBe(true);

    const user = raw.body.data as { id: string; email: string; name: string };
    expect(user.id).toBe(testUser.id);
    expect(user.email).toBe(testUser.email);
    expect(user.name).toBe(testUser.name);
  });

  test('GET /me returns 401 without token', async ({ apiClient }) => {
    const raw = await apiClient.fetchRaw('GET', '/auth/me');

    expect(raw.status).toBe(401);
  });

  test('POST /refresh returns new token', async ({ apiClient, testUser }) => {
    const raw = await apiClient.fetchRaw('POST', '/auth/refresh', undefined, testUser.token);

    expect(raw.status).toBe(200);
    expect(raw.body.success).toBe(true);

    const data = raw.body.data as { token: string };
    expect(data.token).toBeTruthy();
    expect(typeof data.token).toBe('string');
  });

  test('POST /refresh returns 401 without token', async ({ apiClient }) => {
    const raw = await apiClient.fetchRaw('POST', '/auth/refresh');

    expect(raw.status).toBe(401);
  });
});
