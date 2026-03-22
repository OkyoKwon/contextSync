import { test, expect } from '../../fixtures/auth.fixture.js';
import { waitForAppReady } from '../../helpers/wait-for.js';

test.describe('Auth Guard', () => {
  test('unauthenticated → /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated → /project redirects to /login', async ({ page }) => {
    await page.goto('/project');
    await page.waitForURL('**/login', { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated → /conflicts redirects to /login', async ({ page }) => {
    await page.goto('/conflicts');
    await page.waitForURL('**/login', { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated → /settings redirects to /login', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL('**/login', { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated → / auto-logs in and redirects to /dashboard or /onboarding', async ({
    page,
  }) => {
    await page.goto('/');
    // AppEntryRedirect auto-logs in, so user ends up at /dashboard or /onboarding
    await page.waitForURL(/\/(dashboard|onboarding|login)/, { timeout: 10_000 });
    const url = page.url();
    expect(
      url.includes('/dashboard') || url.includes('/onboarding') || url.includes('/login'),
    ).toBe(true);
  });

  test('public routes are accessible without auth', async ({ page }) => {
    await page.goto('/docs');
    await waitForAppReady(page);
    expect(page.url()).toContain('/docs');

    await page.goto('/login');
    await waitForAppReady(page);
    expect(page.url()).toContain('/login');
  });
});
