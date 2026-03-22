import { test, expect } from '../../fixtures/auth.fixture.js';

test.describe('API Key Management', () => {
  test('Set API key via PUT /me/api-key', async ({ apiClient, testUser }) => {
    const raw = await apiClient.fetchRaw(
      'PUT',
      '/auth/me/api-key',
      { apiKey: 'sk-ant-test-key-for-e2e' },
      testUser.token,
    );

    expect(raw.status).toBe(200);
    expect(raw.body.success).toBe(true);
  });

  test('GET /me reflects hasApiKey after set', async ({ apiClient, testUser }) => {
    await apiClient.fetchRaw(
      'PUT',
      '/auth/me/api-key',
      { apiKey: 'sk-ant-test-key-for-e2e' },
      testUser.token,
    );

    const raw = await apiClient.fetchRaw('GET', '/auth/me', undefined, testUser.token);
    expect(raw.status).toBe(200);

    const user = raw.body.data as Record<string, unknown>;
    expect(user.hasAnthropicApiKey).toBe(true);
  });

  test('DELETE /me/api-key removes key', async ({ apiClient, testUser }) => {
    await apiClient.fetchRaw(
      'PUT',
      '/auth/me/api-key',
      { apiKey: 'sk-ant-test-key-for-e2e' },
      testUser.token,
    );

    const raw = await apiClient.fetchRaw('DELETE', '/auth/me/api-key', undefined, testUser.token);

    expect(raw.status).toBe(200);
    expect(raw.body.success).toBe(true);
  });

  test('PUT /me/api-key rejects empty key', async ({ apiClient, testUser }) => {
    const raw = await apiClient.fetchRaw('PUT', '/auth/me/api-key', { apiKey: '' }, testUser.token);

    expect(raw.status).toBe(400);
  });
});
