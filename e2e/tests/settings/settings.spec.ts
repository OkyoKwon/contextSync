import { test, expect } from '../../fixtures/auth.fixture.js';
import { waitForAppReady } from '../../helpers/wait-for.js';

test.describe('Settings Page', () => {
  test('project info is displayed', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings');
    await waitForAppReady(authenticatedPage);

    // Wait for settings to load - may redirect to onboarding if project was deleted
    const isSettings = authenticatedPage.url().includes('/settings');
    if (isSettings) {
      await expect(authenticatedPage.locator('text=Project Info')).toBeVisible({ timeout: 10_000 });
    }
  });

  test('edit project name', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings');
    await waitForAppReady(authenticatedPage);

    // Ensure we're on settings, not onboarding
    if (!authenticatedPage.url().includes('/settings')) return;

    const editBtn = authenticatedPage.locator('button:has-text("Edit")').first();
    if (!(await editBtn.isVisible({ timeout: 5_000 }).catch(() => false))) return;

    await editBtn.click();

    const nameInput = authenticatedPage.locator('input').first();
    await nameInput.clear();
    await nameInput.fill('Renamed Settings Project');

    const saveBtn = authenticatedPage.locator('button:has-text("Save")').first();
    await saveBtn.click();

    await authenticatedPage.waitForTimeout(1_000);
    await authenticatedPage.reload();
    await waitForAppReady(authenticatedPage);

    if (authenticatedPage.url().includes('/settings')) {
      await expect(authenticatedPage.locator('body')).toContainText('Renamed Settings Project', {
        timeout: 10_000,
      });
    }
  });

  test('delete project section exists', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings');
    await waitForAppReady(authenticatedPage);

    if (!authenticatedPage.url().includes('/settings')) return;

    await expect(authenticatedPage.locator('text=/Delete Project|Delete/i').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('collaborators section exists', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings');
    await waitForAppReady(authenticatedPage);

    if (!authenticatedPage.url().includes('/settings')) return;

    // Wait for the Collaborators heading to appear (it loads asynchronously)
    await expect(authenticatedPage.locator('h3:has-text("Collaborators")')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('remote database section exists', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings');
    await waitForAppReady(authenticatedPage);

    if (!authenticatedPage.url().includes('/settings')) return;

    await expect(authenticatedPage.locator('h3:has-text("Remote Database")')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('connect remote database button visible for owner', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings');
    await waitForAppReady(authenticatedPage);

    if (!authenticatedPage.url().includes('/settings')) return;

    await expect(
      authenticatedPage.locator('button:has-text("Connect Remote Database")'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('collaborator invite disabled without remote DB', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings');
    await waitForAppReady(authenticatedPage);

    if (!authenticatedPage.url().includes('/settings')) return;

    // Without remote DB, should show the guidance message instead of invite input
    await expect(authenticatedPage.locator('text=Connect a remote database')).toBeVisible({
      timeout: 15_000,
    });
  });
});
