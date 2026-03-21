import type { Page } from '@playwright/test';
import { test as apiTest } from './api.fixture.js';
import { buildUser, buildProject } from '../helpers/test-data.js';

interface TestUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly token: string;
}

export interface AuthFixture {
  readonly testUser: TestUser;
  readonly testProjectId: string;
  readonly authenticatedPage: Page;
}

export const test = apiTest.extend<AuthFixture>({
  testUser: async ({ apiClient }, use) => {
    const { name, email } = buildUser();
    const { token, user } = await apiClient.login(name, email);
    await use({ id: user.id, email: user.email, name: user.name, token });
  },

  testProjectId: async ({ apiClient, testUser }, use) => {
    const input = buildProject();
    const project = await apiClient.createProject(testUser.token, input);
    await use(project.id);
  },

  authenticatedPage: async ({ page, testUser, testProjectId }, use) => {
    const storageValue = JSON.stringify({
      state: {
        token: testUser.token,
        user: { id: testUser.id, email: testUser.email, name: testUser.name },
        currentProjectId: testProjectId,
      },
      version: 0,
    });

    await page.addInitScript((value) => {
      window.localStorage.setItem('context-sync-auth', value);
    }, storageValue);

    await use(page);
  },
});

export { expect } from '@playwright/test';
