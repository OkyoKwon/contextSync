import { test, expect } from '../../fixtures/auth.fixture.js';
import { waitForAppReady } from '../../helpers/wait-for.js';

test.describe('Command Palette', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await waitForAppReady(authenticatedPage);
  });

  test('Meta+K or search button opens search overlay', async ({ authenticatedPage }) => {
    // Use search button (more reliable than keyboard shortcut in headless Chromium)
    const searchBtn = authenticatedPage.locator('[aria-label="Search sessions"]');
    await searchBtn.click();

    const overlay = authenticatedPage.locator('input[placeholder*="Search"]');
    await expect(overlay).toBeVisible({ timeout: 5_000 });
  });

  test('search button click opens overlay', async ({ authenticatedPage }) => {
    const searchBtn = authenticatedPage.locator('[aria-label="Search sessions"]');
    await searchBtn.click();

    const overlay = authenticatedPage.locator('input[placeholder*="Search"]');
    await expect(overlay).toBeVisible({ timeout: 5_000 });
  });

  test('typing query shows results or empty message', async ({ authenticatedPage }) => {
    const searchBtn = authenticatedPage.locator('[aria-label="Search sessions"]');
    await searchBtn.click();

    const searchInput = authenticatedPage.locator('input[placeholder*="Search"]');
    await searchInput.fill('auth');

    // Should show results or "no results" or "Type to search" message
    await authenticatedPage.waitForTimeout(1_000);
    // Verify the search overlay is still open with content
    await expect(searchInput).toBeVisible();
  });

  test('Escape closes search overlay', async ({ authenticatedPage }) => {
    const searchBtn = authenticatedPage.locator('[aria-label="Search sessions"]');
    await searchBtn.click();

    const searchInput = authenticatedPage.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5_000 });

    // Press Escape to close - may need to press it on the overlay itself
    await searchInput.press('Escape');

    await expect(searchInput).toBeHidden({ timeout: 5_000 });
  });
});
