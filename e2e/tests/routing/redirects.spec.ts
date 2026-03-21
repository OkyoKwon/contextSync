import { test, expect } from '../../fixtures/auth.fixture.js';

test.describe('Route Redirects', () => {
  test('/sessions redirects to /project', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sessions');
    await authenticatedPage.waitForURL('**/project', { timeout: 10_000 });
    expect(authenticatedPage.url()).toContain('/project');
    expect(authenticatedPage.url()).not.toContain('/sessions');
  });

  test('/sessions/:id redirects to /project/sessions/:id', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sessions/some-session-id');
    await authenticatedPage.waitForURL('**/project/sessions/some-session-id', { timeout: 10_000 });
    expect(authenticatedPage.url()).toContain('/project/sessions/some-session-id');
  });

  test('/settings/team redirects to /settings', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings/team');
    await authenticatedPage.waitForURL((url) => url.pathname === '/settings', { timeout: 10_000 });
    expect(new URL(authenticatedPage.url()).pathname).toBe('/settings');
  });

  test('/settings/project redirects to /settings', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings/project');
    await authenticatedPage.waitForURL((url) => url.pathname === '/settings', { timeout: 10_000 });
    expect(new URL(authenticatedPage.url()).pathname).toBe('/settings');
  });
});
