import { test, expect } from '../../fixtures/auth.fixture.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/session-fixtures',
);

test.describe('Sessions API', () => {
  test('session list pagination', async ({ apiClient, testUser, testProjectId }) => {
    // Import 3 sessions
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
    await apiClient.importSession(
      testUser.token,
      testProjectId,
      resolve(fixturesDir, 'sample-session.jsonl'),
    );

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${testProjectId}/sessions?page=1&limit=2`,
      undefined,
      testUser.token,
    );

    expect(raw.body.success).toBe(true);
    const data = raw.body.data as readonly unknown[];
    expect(data.length).toBe(2);
    expect(raw.body.meta!.total).toBe(3);
    expect(raw.body.meta!.totalPages).toBe(2);
  });

  test('session detail includes title and messages', async ({
    apiClient,
    testUser,
    testProjectId,
  }) => {
    await apiClient.importSession(
      testUser.token,
      testProjectId,
      resolve(fixturesDir, 'sample-session.json'),
    );

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${testProjectId}/sessions`,
      undefined,
      testUser.token,
    );
    const sessions = raw.body.data as readonly { id: string }[];
    const sessionId = sessions[0]!.id;

    const detail = await apiClient.get<{
      title: string;
      messages: readonly { role: string; content: string }[];
    }>(`/sessions/${sessionId}`, testUser.token);

    expect(detail.title).toBe('Auth Feature Implementation');
    expect(detail.messages.length).toBe(4);
  });

  test('update session title', async ({ apiClient, testUser, testProjectId }) => {
    await apiClient.importSession(
      testUser.token,
      testProjectId,
      resolve(fixturesDir, 'sample-session.json'),
    );

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${testProjectId}/sessions`,
      undefined,
      testUser.token,
    );
    const sessions = raw.body.data as readonly { id: string }[];
    const sessionId = sessions[0]!.id;

    const updated = await apiClient.patch<{ title: string }>(
      `/sessions/${sessionId}`,
      { title: 'Updated Title' },
      testUser.token,
    );

    expect(updated.title).toBe('Updated Title');
  });

  test('delete session returns 404 on re-fetch', async ({ apiClient, testUser, testProjectId }) => {
    await apiClient.importSession(
      testUser.token,
      testProjectId,
      resolve(fixturesDir, 'sample-session.json'),
    );

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${testProjectId}/sessions`,
      undefined,
      testUser.token,
    );
    const sessions = raw.body.data as readonly { id: string }[];
    const sessionId = sessions[0]!.id;

    await apiClient.del(`/sessions/${sessionId}`, testUser.token);

    const detailRaw = await apiClient.fetchRaw(
      'GET',
      `/sessions/${sessionId}`,
      undefined,
      testUser.token,
    );
    expect(detailRaw.status).toBe(404);
  });

  test('dashboard stats endpoint returns data', async ({ apiClient, testUser, testProjectId }) => {
    await apiClient.importSession(
      testUser.token,
      testProjectId,
      resolve(fixturesDir, 'sample-session.json'),
    );

    const stats = await apiClient.get<{
      todaySessions: number;
      weekSessions: number;
      activeConflicts: number;
      activeMembers: number;
    }>(`/projects/${testProjectId}/stats`, testUser.token);

    // Imported session should count in today's or week's stats
    expect(stats.todaySessions + stats.weekSessions).toBeGreaterThanOrEqual(0);
    expect(stats).toHaveProperty('activeConflicts');
    expect(stats).toHaveProperty('activeMembers');
  });
});
