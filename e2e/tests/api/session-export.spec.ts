import { test, expect } from '../../fixtures/auth.fixture.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = 'http://localhost:3099/api';

const fixturesDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/session-fixtures',
);

test.describe('Session Export', () => {
  test('Export sessions as markdown', async ({ apiClient, testUser, testProjectId }) => {
    await apiClient.importSession(
      testUser.token,
      testProjectId,
      resolve(fixturesDir, 'sample-session.json'),
    );

    const response = await fetch(`${API_BASE}/projects/${testProjectId}/sessions/export/markdown`, {
      headers: { Authorization: `Bearer ${testUser.token}` },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/markdown');

    const body = await response.text();
    expect(body).toContain('Auth Feature Implementation');
  });

  test('Export empty project returns valid response', async ({
    apiClient,
    testUser,
    testProjectId,
  }) => {
    const response = await fetch(`${API_BASE}/projects/${testProjectId}/sessions/export/markdown`, {
      headers: { Authorization: `Bearer ${testUser.token}` },
    });

    expect(response.status).toBe(200);
  });

  test('Export requires authentication', async ({ testProjectId }) => {
    const response = await fetch(`${API_BASE}/projects/${testProjectId}/sessions/export/markdown`);

    expect(response.status).toBe(401);
  });
});
