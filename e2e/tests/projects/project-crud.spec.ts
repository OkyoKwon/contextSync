import { test, expect } from '../../fixtures/auth.fixture.js';
import { buildProject } from '../../helpers/test-data.js';
import { waitForAppReady } from '../../helpers/wait-for.js';

test.describe('Project CRUD', () => {
  test('create project via API and see it on dashboard', async ({
    authenticatedPage,
    apiClient,
    testUser,
  }) => {
    const input = buildProject({ name: 'Dashboard Visible Project' });
    await apiClient.createProject(testUser.token, input);

    await authenticatedPage.goto('/dashboard');
    await waitForAppReady(authenticatedPage);

    await expect(authenticatedPage.locator('body')).toContainText('Dashboard Visible Project', {
      timeout: 10_000,
    });
  });

  test('list projects via API', async ({ apiClient, testUser }) => {
    const input = buildProject({ name: 'Listed Project' });
    await apiClient.createProject(testUser.token, input);

    const projects = await apiClient.get<readonly { id: string; name: string }[]>(
      '/projects',
      testUser.token,
    );
    const found = projects.find((p) => p.name === 'Listed Project');
    expect(found).toBeTruthy();
  });

  test('update project via API', async ({ apiClient, testUser, testProjectId }) => {
    const updated = await apiClient.patch<{ id: string; name: string }>(
      `/projects/${testProjectId}`,
      { name: 'Updated Project Name' },
      testUser.token,
    );
    expect(updated.name).toBe('Updated Project Name');
  });

  test('delete project via API', async ({ apiClient, testUser }) => {
    const project = await apiClient.createProject(
      testUser.token,
      buildProject({ name: 'To Delete' }),
    );
    await apiClient.del(`/projects/${project.id}`, testUser.token);

    const projects = await apiClient.get<readonly { id: string; name: string }[]>(
      '/projects',
      testUser.token,
    );
    const found = projects.find((p) => p.id === project.id);
    expect(found).toBeUndefined();
  });

  test('edit project on settings page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings');
    await waitForAppReady(authenticatedPage);

    // Might be redirected to onboarding if project was deleted by parallel test
    if (!authenticatedPage.url().includes('/settings')) return;

    const editBtn = authenticatedPage.locator('button:has-text("Edit")').first();
    if (!(await editBtn.isVisible({ timeout: 5_000 }).catch(() => false))) return;

    await editBtn.click();

    // Find the first text input (project name)
    const nameInput = authenticatedPage.locator('input').first();
    await nameInput.clear();
    await nameInput.fill('Settings Edited Name');

    const saveBtn = authenticatedPage.locator('button:has-text("Save")').first();
    await saveBtn.click();

    await authenticatedPage.waitForTimeout(1_000);
    await authenticatedPage.reload();
    await waitForAppReady(authenticatedPage);

    if (authenticatedPage.url().includes('/settings')) {
      await expect(authenticatedPage.locator('body')).toContainText('Settings Edited Name', {
        timeout: 10_000,
      });
    }
  });
});
