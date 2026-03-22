import { test, expect } from '../../fixtures/auth.fixture.js';
import { waitForAppReady } from '../../helpers/wait-for.js';

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await waitForAppReady(authenticatedPage);
  });

  test('navigation links are rendered', async ({ authenticatedPage }) => {
    const sidebar = authenticatedPage.locator('nav, aside').first();

    await expect(sidebar.locator('text=Dashboard')).toBeVisible({ timeout: 5_000 });
    await expect(sidebar.locator('text=Conversations')).toBeVisible({ timeout: 5_000 });
    await expect(sidebar.locator('text=Settings')).toBeVisible({ timeout: 5_000 });
  });

  test('clicking nav link navigates to page', async ({ authenticatedPage }) => {
    const settingsLink = authenticatedPage.locator('a:has-text("Settings")').first();
    await settingsLink.click();

    await authenticatedPage.waitForURL('**/settings', { timeout: 5_000 });
    expect(authenticatedPage.url()).toContain('/settings');
  });

  test('sidebar collapse/expand toggle', async ({ authenticatedPage }) => {
    // Find sidebar element
    const sidebar = authenticatedPage.locator('[class*="w-60"], [class*="w-16"]').first();
    const initialClasses = await sidebar.getAttribute('class');

    // Find toggle button (usually at bottom of sidebar)
    const toggleBtn = authenticatedPage
      .locator(
        'button[aria-label*="collapse"], button[aria-label*="sidebar"], button[aria-label*="toggle"]',
      )
      .first();

    // If no labeled button, look for the collapse icon button in sidebar
    if (!(await toggleBtn.isVisible({ timeout: 2_000 }).catch(() => false))) {
      // Try clicking a generic toggle in the sidebar area
      const sidebarToggle = authenticatedPage.locator('aside button, nav button').last();
      await sidebarToggle.click();
    } else {
      await toggleBtn.click();
    }

    // Wait for transition
    await authenticatedPage.waitForTimeout(500);

    const newClasses = await sidebar.getAttribute('class');
    // Classes should change (w-60 ↔ w-16)
    expect(newClasses).not.toBe(initialClasses);
  });
});
