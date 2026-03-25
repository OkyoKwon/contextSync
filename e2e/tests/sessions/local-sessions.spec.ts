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

  test('Manual sync rejects empty sessionIds array', async ({
    apiClient,
    testUser,
    testProjectId,
  }) => {
    const raw = await apiClient.fetchRaw(
      'POST',
      `/projects/${testProjectId}/sessions/sync`,
      { sessionIds: [] },
      testUser.token,
    );

    expect(raw.status).toBe(400);
    expect(raw.body.success).toBe(false);
  });

  test('Recalculate tokens endpoint responds for project', async ({
    apiClient,
    testUser,
    testProjectId,
  }) => {
    const raw = await apiClient.fetchRaw(
      'POST',
      `/projects/${testProjectId}/sessions/recalculate-tokens`,
      {},
      testUser.token,
    );

    expect(raw.status).toBe(200);
    expect(raw.body.success).toBe(true);
  });

  test('Manual sync requires authentication', async ({ apiClient, testProjectId }) => {
    const raw = await apiClient.fetchRaw('POST', `/projects/${testProjectId}/sessions/sync`, {
      sessionIds: ['test'],
    });

    expect(raw.status).toBe(401);
  });
});
