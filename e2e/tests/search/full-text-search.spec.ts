import { test, expect } from '../../fixtures/auth.fixture.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/session-fixtures',
);

test.describe('Full-Text Search', () => {
  test.beforeEach(async ({ apiClient, testUser, testProjectId }) => {
    await apiClient.importSession(
      testUser.token,
      testProjectId,
      resolve(fixturesDir, 'sample-session.json'),
    );
  });

  test('search API returns matching results', async ({ apiClient, testUser, testProjectId }) => {
    // Search for "auth" which appears in the session title "Auth Feature Implementation"
    const result = await apiClient.get<{
      readonly results: readonly { type: string; id: string }[];
      readonly total: number;
    }>(`/projects/${testProjectId}/search?q=auth`, testUser.token);

    expect(result.results.length).toBeGreaterThan(0);
  });

  test('search with nonexistent term returns empty', async ({
    apiClient,
    testUser,
    testProjectId,
  }) => {
    const result = await apiClient.get<{
      readonly results: readonly unknown[];
      readonly total: number;
    }>(`/projects/${testProjectId}/search?q=xyznonexistent99`, testUser.token);

    expect(result.results.length).toBe(0);
  });

  test('search type filter works', async ({ apiClient, testUser, testProjectId }) => {
    const sessionResult = await apiClient.get<{
      readonly results: readonly { type: string }[];
    }>(`/projects/${testProjectId}/search?q=auth&type=session`, testUser.token);

    const messageResult = await apiClient.get<{
      readonly results: readonly { type: string }[];
    }>(`/projects/${testProjectId}/search?q=auth&type=message`, testUser.token);

    // Session-only results should only have type 'session'
    for (const r of sessionResult.results) {
      expect(r.type).toBe('session');
    }
    // Message-only results should only have type 'message'
    for (const r of messageResult.results) {
      expect(r.type).toBe('message');
    }
  });
});
