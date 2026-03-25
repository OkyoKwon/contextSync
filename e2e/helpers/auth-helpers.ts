import type { Page } from '@playwright/test';

export async function setAuthState(
  page: Page,
  token: string,
  user: { id: string; email: string; name: string },
  projectId: string,
): Promise<void> {
  await page.addInitScript(
    (value) => window.localStorage.setItem('context-sync-auth', value),
    JSON.stringify({ state: { token, user, currentProjectId: projectId }, version: 0 }),
  );
}
