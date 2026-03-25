import { test, expect } from '../../fixtures/auth.fixture.js';
import { buildUser, buildProject } from '../../helpers/test-data.js';
import { waitForAppReady } from '../../helpers/wait-for.js';

test.describe('Identify Flow', () => {
  test('new user identify → onboarding → dashboard', async ({ page }) => {
    await page.goto('/onboarding');
    await waitForAppReady(page);

    const name = `New User ${Date.now()}`;
    await page.fill('input[placeholder="Enter your name"]', name);
    await page.click('button[type="submit"]');

    // Should go to onboarding for new user or dashboard for existing
    await page.waitForURL(
      (url) => {
        const p = url.pathname;
        return p.includes('/onboarding') || p.includes('/dashboard');
      },
      { timeout: 15_000 },
    );

    if (page.url().includes('/onboarding')) {
      // Fill project name in step 1
      const projectInput = page.locator('input[placeholder="My Project"]');
      await projectInput.waitFor({ state: 'visible', timeout: 10_000 });
      await projectInput.fill('My E2E Project');

      // Click Next
      const nextBtn = page.locator('button:has-text("Next")');
      if (await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await nextBtn.click();
      }

      // Step 2: Create Project or Skip
      const createBtn = page.locator('button:has-text("Create Project")');
      const skipBtn = page.locator('button:has-text("Skip")');
      if (await createBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await createBtn.click();
      } else if (await skipBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await skipBtn.click();
      }

      await page.waitForURL('**/dashboard', { timeout: 15_000 });
    }

    expect(page.url()).toContain('/dashboard');
  });

  test('existing user identify → dashboard directly', async ({ page, apiClient }) => {
    const { name } = buildUser();
    const { token } = await apiClient.identify(name);
    await apiClient.createProject(token, buildProject());

    await page.goto('/onboarding');
    await waitForAppReady(page);

    await page.fill('input[placeholder="Enter your name"]', name);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('empty field submission is blocked', async ({ page }) => {
    await page.goto('/onboarding');
    await waitForAppReady(page);

    // Submit button should be disabled when name field is empty
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
    expect(page.url()).toContain('/onboarding');
  });

  test('authenticated user visiting /onboarding redirects to dashboard', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/onboarding');
    await authenticatedPage.waitForURL((url) => !url.pathname.includes('/onboarding'), {
      timeout: 10_000,
    });
    expect(authenticatedPage.url()).toContain('/dashboard');
  });

  test('/login redirects to /onboarding', async ({ page }) => {
    await page.goto('/login');
    await page.waitForURL('**/onboarding', { timeout: 10_000 });
    expect(page.url()).toContain('/onboarding');
  });
});
