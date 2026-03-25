import { test, expect } from '../../fixtures/auth.fixture.js';
import { waitForAppReady } from '../../helpers/wait-for.js';

test.describe('Auth Guard', () => {
  test('unauthenticated → /dashboard redirects to /onboarding', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/onboarding', { timeout: 10_000 });
    expect(page.url()).toContain('/onboarding');
  });

  test('unauthenticated → /project redirects to /onboarding', async ({ page }) => {
    await page.goto('/project');
    await page.waitForURL('**/onboarding', { timeout: 10_000 });
    expect(page.url()).toContain('/onboarding');
  });

  test('unauthenticated → /conflicts redirects to /onboarding', async ({ page }) => {
    await page.goto('/conflicts');
    await page.waitForURL('**/onboarding', { timeout: 10_000 });
    expect(page.url()).toContain('/onboarding');
  });

  test('unauthenticated → /settings redirects to /onboarding', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL('**/onboarding', { timeout: 10_000 });
    expect(page.url()).toContain('/onboarding');
  });

  test('unauthenticated → / redirects to /onboarding or /dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 10_000 });
    const url = page.url();
    expect(url.includes('/dashboard') || url.includes('/onboarding')).toBe(true);
  });

  test('public routes are accessible without auth', async ({ page }) => {
    await page.goto('/onboarding');
    await waitForAppReady(page);
    expect(page.url()).toContain('/onboarding');
  });
});
