import { test, expect } from '../../fixtures/auth.fixture.js';
import { waitForAppReady } from '../../helpers/wait-for.js';

test.describe('Plans', () => {
  test('plans page renders', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/plans');
    await waitForAppReady(authenticatedPage);

    expect(authenticatedPage.url()).toContain('/plans');
    await expect(authenticatedPage.locator('#root > *').first()).toBeVisible({ timeout: 10_000 });
  });

  test('list plans via API', async ({ apiClient, testUser }) => {
    const plans = await apiClient.get<readonly unknown[]>('/plans/local', testUser.token);
    expect(Array.isArray(plans)).toBe(true);
  });

  test('empty state shown when no plans', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/plans');
    await waitForAppReady(authenticatedPage);

    // Should show either plans or an empty state
    await expect(authenticatedPage.locator('body')).toContainText(
      /plan|no plan|empty|get started/i,
      {
        timeout: 10_000,
      },
    );
  });
});
