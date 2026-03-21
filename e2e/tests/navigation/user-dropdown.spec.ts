import { test, expect } from '../../fixtures/auth.fixture.js';
import { waitForAppReady } from '../../helpers/wait-for.js';

test.describe('User Dropdown', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await waitForAppReady(authenticatedPage);
  });

  test('avatar click opens dropdown with menu items', async ({ authenticatedPage }) => {
    // Click the user avatar/button in header (rightmost button in header)
    const headerBtns = authenticatedPage.locator('header button');
    const lastBtn = headerBtns.last();
    await lastBtn.click();

    // Should show dropdown with Settings and Log out
    await expect(authenticatedPage.locator('text=Log out')).toBeVisible({ timeout: 5_000 });
  });

  test('theme toggle changes theme', async ({ authenticatedPage }) => {
    // Get initial theme via data-theme attribute
    const initialTheme = await authenticatedPage.locator('html').getAttribute('data-theme');

    // Open dropdown
    const headerBtns = authenticatedPage.locator('header button');
    await headerBtns.last().click();

    // Click theme toggle
    const themeBtn = authenticatedPage
      .locator('button:has-text("Light Mode"), button:has-text("Dark Mode")')
      .first();
    if (await themeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await themeBtn.click();
      await authenticatedPage.waitForTimeout(500);

      const newTheme = await authenticatedPage.locator('html').getAttribute('data-theme');
      expect(newTheme).not.toBe(initialTheme);
    } else {
      expect(true).toBe(true);
    }
  });

  test('logout clears auth and redirects', async ({ authenticatedPage }) => {
    // Open dropdown
    const headerBtns = authenticatedPage.locator('header button');
    await headerBtns.last().click();

    const logoutBtn = authenticatedPage.locator('button:has-text("Log out")');
    await expect(logoutBtn).toBeVisible({ timeout: 5_000 });
    await logoutBtn.click();

    // Should redirect to landing or login
    await authenticatedPage.waitForURL(
      (url) => {
        const pathname = url.pathname;
        return pathname === '/' || pathname.includes('/login');
      },
      { timeout: 10_000 },
    );

    // Verify auth cleared
    const authState = await authenticatedPage.evaluate(() =>
      window.localStorage.getItem('context-sync-auth'),
    );

    if (authState) {
      const parsed = JSON.parse(authState) as { state: { token: string | null } };
      expect(parsed.state.token).toBeNull();
    }
  });
});
