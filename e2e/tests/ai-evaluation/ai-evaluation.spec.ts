import { test, expect } from '../../fixtures/auth.fixture.js';
import { waitForAppReady } from '../../helpers/wait-for.js';

test.describe('AI Evaluation', () => {
  test('evaluation page renders', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai-evaluation');
    await waitForAppReady(authenticatedPage);

    // Page should load without errors
    expect(authenticatedPage.url()).toContain('/ai-evaluation');
    await expect(authenticatedPage.locator('#root > *').first()).toBeVisible({ timeout: 10_000 });
  });

  test('evaluation trigger fails gracefully without API key', async ({
    apiClient,
    testUser,
    testProjectId,
  }) => {
    const raw = await apiClient.fetchRaw(
      'POST',
      `/projects/${testProjectId}/ai-evaluation/evaluate`,
      { sessionIds: [] },
      testUser.token,
    );

    // Should return error (missing API key or invalid input)
    expect(raw.body.success).toBe(false);
  });

  test('empty evaluation history', async ({ apiClient, testUser, testProjectId }) => {
    // targetUserId is required
    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${testProjectId}/ai-evaluation/history?targetUserId=${testUser.id}`,
      undefined,
      testUser.token,
    );

    expect(raw.body.success).toBe(true);
    const data = raw.body.data as readonly unknown[];
    expect(data.length).toBe(0);
  });
});
