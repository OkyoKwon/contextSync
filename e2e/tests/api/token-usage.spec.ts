import { test, expect } from '../../fixtures/auth.fixture.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/session-fixtures',
);

test.describe('Token Usage', () => {
  test('Token usage endpoint returns data', async ({ apiClient, testUser, testProjectId }) => {
    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${testProjectId}/token-usage`,
      undefined,
      testUser.token,
    );

    expect(raw.status).toBe(200);
    expect(raw.body.success).toBe(true);
    expect(raw.body.data).toBeTruthy();
  });

  test('Token usage with period filter', async ({ apiClient, testUser, testProjectId }) => {
    const periods = ['7d', '30d', '90d'] as const;

    for (const period of periods) {
      const raw = await apiClient.fetchRaw(
        'GET',
        `/projects/${testProjectId}/token-usage?period=${period}`,
        undefined,
        testUser.token,
      );

      expect(raw.status).toBe(200);
      expect(raw.body.success).toBe(true);
    }
  });

  test('Token usage after session import', async ({ apiClient, testUser, testProjectId }) => {
    await apiClient.importSession(
      testUser.token,
      testProjectId,
      resolve(fixturesDir, 'sample-session.json'),
    );

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${testProjectId}/token-usage`,
      undefined,
      testUser.token,
    );

    expect(raw.status).toBe(200);
    expect(raw.body.success).toBe(true);
    expect(raw.body.data).toBeTruthy();
  });

  test('Recalculate tokens endpoint', async ({ apiClient, testUser, testProjectId }) => {
    const raw = await apiClient.fetchRaw(
      'POST',
      `/projects/${testProjectId}/sessions/recalculate-tokens`,
      undefined,
      testUser.token,
    );

    expect(raw.status).toBe(200);
    expect(raw.body.success).toBe(true);
  });
});
