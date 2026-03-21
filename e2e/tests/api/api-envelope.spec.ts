import { test, expect } from '../../fixtures/auth.fixture.js';

test.describe('API Response Envelope', () => {
  test('success response has correct shape', async ({ apiClient, testUser }) => {
    const raw = await apiClient.fetchRaw('GET', '/projects', undefined, testUser.token);

    expect(raw.status).toBe(200);
    expect(raw.body.success).toBe(true);
    expect(raw.body.data).not.toBeNull();
    expect(raw.body.error).toBeNull();
  });

  test('error response has correct shape', async ({ apiClient, testUser }) => {
    // Send invalid body to a POST endpoint
    const raw = await apiClient.fetchRaw('POST', '/projects', {}, testUser.token);

    expect(raw.body.success).toBe(false);
    expect(raw.body.data).toBeNull();
    expect(typeof raw.body.error).toBe('string');
  });

  test('401 response when no token', async ({ apiClient }) => {
    const raw = await apiClient.fetchRaw('GET', '/projects');
    expect(raw.status).toBe(401);
  });

  test('paginated response includes meta', async ({ apiClient, testUser, testProjectId }) => {
    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${testProjectId}/sessions?page=1&limit=10`,
      undefined,
      testUser.token,
    );

    expect(raw.status).toBe(200);
    expect(raw.body.success).toBe(true);
    expect(raw.body.meta).toBeDefined();
    expect(raw.body.meta!.total).toBeDefined();
    expect(raw.body.meta!.page).toBe(1);
    expect(raw.body.meta!.limit).toBe(10);
    expect(raw.body.meta!.totalPages).toBeDefined();
  });
});
