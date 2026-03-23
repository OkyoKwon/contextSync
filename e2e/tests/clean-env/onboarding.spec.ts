import { test, expect } from '../../fixtures/auth.fixture.js';
import { waitForAppReady } from '../../helpers/wait-for.js';

test.describe('Onboarding — First User Experience', () => {
  test('CLEAN-009: New user identify redirects to onboarding', async ({ page }) => {
    await page.goto('/identify');
    await waitForAppReady(page);

    const name = `Clean User ${Date.now()}`;

    await page.fill('input[placeholder="Enter your name"]', name);
    await page.click('button[type="submit"]');

    await page.waitForURL(
      (url) => url.pathname.includes('/onboarding') || url.pathname.includes('/dashboard'),
      { timeout: 15_000 },
    );

    expect(page.url()).toContain('/onboarding');
  });

  test('CLEAN-010: Onboarding creates first project and redirects to dashboard', async ({
    page,
  }) => {
    await page.goto('/identify');
    await waitForAppReady(page);

    const name = `Onboard User ${Date.now()}`;

    await page.fill('input[placeholder="Enter your name"]', name);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => url.pathname.includes('/onboarding'), { timeout: 15_000 });

    // Step 1: Fill project name
    const projectInput = page.locator('input[placeholder="My Project"]');
    await projectInput.waitFor({ state: 'visible', timeout: 10_000 });
    await projectInput.fill('My Clean Env Project');

    // Click Next
    const nextBtn = page.locator('button:has-text("Next")');
    if (await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nextBtn.click();
    }

    // Step 2: Create Project
    const createBtn = page.locator('button:has-text("Create Project")');
    await createBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await createBtn.click();

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('CLEAN-011: Second identify skips onboarding', async ({ page, apiClient }) => {
    // Create a user with a project via API first
    const name = `Returning User ${Date.now()}`;
    const email = `returning-${Date.now()}-${Math.random().toString(36).slice(2)}@e2e.test`;
    const { token } = await apiClient.login(name, email);
    await apiClient.createProject(token, { name: 'Existing Project' });

    // Now identify via UI — should skip onboarding
    await page.goto('/identify');
    await waitForAppReady(page);

    await page.fill('input[placeholder="Enter your name"]', name);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('CLEAN-012: Onboarding skip works', async ({ page }) => {
    await page.goto('/identify');
    await waitForAppReady(page);

    const name = `Skip User ${Date.now()}`;

    await page.fill('input[placeholder="Enter your name"]', name);
    await page.click('button[type="submit"]');

    await page.waitForURL(
      (url) => url.pathname.includes('/onboarding') || url.pathname.includes('/dashboard'),
      { timeout: 15_000 },
    );

    if (page.url().includes('/onboarding')) {
      const skipBtn = page.locator('button:has-text("Skip")');
      await skipBtn.waitFor({ state: 'visible', timeout: 5_000 });
      await skipBtn.click();

      await page.waitForURL('**/dashboard', { timeout: 15_000 });
    }

    expect(page.url()).toContain('/dashboard');
  });
});
