import { test, expect } from '../../fixtures/auth.fixture.js';
import { waitForAppReady } from '../../helpers/wait-for.js';

test.describe('Admin Dashboard', () => {
  test('admin page renders', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin');
    await waitForAppReady(authenticatedPage);

    // Should render the admin page (or redirect if not admin)
    expect(authenticatedPage.url()).toMatch(/admin|dashboard/);
  });

  test('regular user cannot access admin API', async ({ apiClient, testUser }) => {
    const raw = await apiClient.fetchRaw('GET', '/admin/status', undefined, testUser.token);

    // Should be 403 (DEPLOYMENT_MODE != team-host or not admin role)
    expect(raw.status).toBe(403);
  });

  test('admin status endpoint requires admin role', async ({ apiClient, testUser }) => {
    // Default test user has 'user' role, not admin
    const raw = await apiClient.fetchRaw('GET', '/admin/config', undefined, testUser.token);

    expect(raw.status).toBe(403);
  });
});
