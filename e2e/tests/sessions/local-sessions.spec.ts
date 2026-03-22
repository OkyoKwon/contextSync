import { test, expect } from '../../fixtures/auth.fixture.js';

test.describe('Local Sessions', () => {
  test('List local sessions endpoint responds', async ({ apiClient, testUser, testProjectId }) => {
    const raw = await apiClient.fetchRaw(
      'GET',
      `/sessions/local?projectId=${testProjectId}`,
      undefined,
      testUser.token,
    );

    expect(raw.status).toBe(200);
    expect(raw.body.data).toBeInstanceOf(Array);
  });

  test('Browse local directory endpoint responds', async ({ apiClient, testUser }) => {
    const raw = await apiClient.fetchRaw(
      'GET',
      '/sessions/local/browse',
      undefined,
      testUser.token,
    );

    expect(raw.status).toBe(200);
  });

  test('Local directories endpoint responds', async ({ apiClient, testUser }) => {
    const raw = await apiClient.fetchRaw(
      'GET',
      '/sessions/local/directories',
      undefined,
      testUser.token,
    );

    expect(raw.status).toBe(200);
    expect(raw.body.data).toBeInstanceOf(Array);
  });
});
