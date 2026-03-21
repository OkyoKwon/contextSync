import { test, expect } from '../../fixtures/auth.fixture.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { waitForAppReady } from '../../helpers/wait-for.js';

const fixturesDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/session-fixtures',
);

test.describe('Session List', () => {
  test.beforeEach(async ({ apiClient, testUser, testProjectId }) => {
    await apiClient.importSession(
      testUser.token,
      testProjectId,
      resolve(fixturesDir, 'sample-session.json'),
    );
    await apiClient.importSession(
      testUser.token,
      testProjectId,
      resolve(fixturesDir, 'sample-session-2.json'),
    );
  });

  test('imported sessions exist via API', async ({ apiClient, testUser, testProjectId }) => {
    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${testProjectId}/sessions`,
      undefined,
      testUser.token,
    );

    const sessions = raw.body.data as readonly { title: string }[];
    const titles = sessions.map((s) => s.title);
    expect(titles).toContain('Auth Feature Implementation');
    expect(titles).toContain('Auth Refactoring');
  });

  test('session detail page shows title', async ({
    apiClient,
    testUser,
    testProjectId,
    authenticatedPage,
  }) => {
    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${testProjectId}/sessions`,
      undefined,
      testUser.token,
    );
    const sessions = raw.body.data as readonly { id: string; title: string }[];
    const session = sessions[0];
    expect(session).toBeTruthy();

    await authenticatedPage.goto(`/project/sessions/${session!.id}`);
    await waitForAppReady(authenticatedPage);

    await expect(authenticatedPage.locator('body')).toContainText(session!.title, {
      timeout: 10_000,
    });
  });

  test('delete session removes it from API', async ({ apiClient, testUser, testProjectId }) => {
    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${testProjectId}/sessions`,
      undefined,
      testUser.token,
    );
    const sessions = raw.body.data as readonly { id: string }[];
    const sessionId = sessions[0]!.id;

    await apiClient.del(`/sessions/${sessionId}`, testUser.token);

    const rawAfter = await apiClient.fetchRaw(
      'GET',
      `/projects/${testProjectId}/sessions`,
      undefined,
      testUser.token,
    );
    const remaining = rawAfter.body.data as readonly { id: string }[];
    const found = remaining.find((s) => s.id === sessionId);
    expect(found).toBeUndefined();
  });
});
