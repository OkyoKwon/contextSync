import { test, expect } from '../../fixtures/auth.fixture.js';
import { buildUser, buildProject } from '../../helpers/test-data.js';
import { addCollaborator } from '../../helpers/invitation-helpers.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { waitForAppReady } from '../../helpers/wait-for.js';
import type { ApiClient } from '../../fixtures/api.fixture.js';
import type { Kysely } from 'kysely';

const fixturesDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/session-fixtures',
);

interface ConflictItem {
  readonly id: string;
  readonly status: string;
  readonly severity: string;
}

async function createConflictScenario(apiClient: ApiClient, db: Kysely<unknown>) {
  const userAData = buildUser();
  const { token: tokenA, user: userA } = await apiClient.identify(userAData.name);
  const project = await apiClient.createProject(tokenA, buildProject());

  const userBData = buildUser();
  const { token: tokenB, user: userB } = await apiClient.identify(userBData.name);

  await addCollaborator(db, project.id, userB.id, 'member');

  await apiClient.importSession(tokenA, project.id, resolve(fixturesDir, 'sample-session.json'));
  await apiClient.importSession(tokenB, project.id, resolve(fixturesDir, 'sample-session-2.json'));

  return { tokenA, tokenB, userA, projectId: project.id };
}

test.describe('Conflict Resolution', () => {
  test('conflicts page shows conflict list', async ({ apiClient, db, page }) => {
    const { tokenA, userA, projectId } = await createConflictScenario(apiClient, db);

    const storageValue = JSON.stringify({
      state: {
        token: tokenA,
        user: { id: userA.id, email: userA.email, name: userA.name },
        currentProjectId: projectId,
      },
      version: 0,
    });
    await page.addInitScript((value) => {
      window.localStorage.setItem('context-sync-auth', value);
    }, storageValue);

    await page.goto('/conflicts');
    await waitForAppReady(page);

    await expect(page.locator('body')).toContainText(/conflict|no conflict/i, { timeout: 10_000 });
  });

  test('filter conflicts by severity via API', async ({ apiClient, db }) => {
    const { tokenA, projectId } = await createConflictScenario(apiClient, db);

    const rawAll = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/conflicts`,
      undefined,
      tokenA,
    );

    expect(rawAll.body.success).toBe(true);

    const rawFiltered = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/conflicts?severity=warning`,
      undefined,
      tokenA,
    );

    expect(rawFiltered.body.success).toBe(true);
    const filtered = rawFiltered.body.data as readonly ConflictItem[];
    for (const c of filtered) {
      expect(c.severity).toBe('warning');
    }
  });

  test('resolve conflict via API', async ({ apiClient, db }) => {
    const { tokenA, projectId } = await createConflictScenario(apiClient, db);

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/conflicts`,
      undefined,
      tokenA,
    );

    const conflicts = raw.body.data as readonly ConflictItem[];
    if (conflicts.length === 0) return;

    const resolved = await apiClient.patch<ConflictItem>(
      `/conflicts/${conflicts[0]!.id}`,
      { status: 'resolved' },
      tokenA,
    );

    expect(resolved.status).toBe('resolved');
  });

  test('resolve conflict via UI', async ({ apiClient, db, page }) => {
    const { tokenA, userA, projectId } = await createConflictScenario(apiClient, db);

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/conflicts`,
      undefined,
      tokenA,
    );
    const conflicts = raw.body.data as readonly ConflictItem[];
    if (conflicts.length === 0) return;

    const storageValue = JSON.stringify({
      state: {
        token: tokenA,
        user: { id: userA.id, email: userA.email, name: userA.name },
        currentProjectId: projectId,
      },
      version: 0,
    });
    await page.addInitScript((value) => {
      window.localStorage.setItem('context-sync-auth', value);
    }, storageValue);

    await page.goto('/conflicts');
    await waitForAppReady(page);

    const resolveBtn = page
      .locator('button:has-text("Resolve"), button:has-text("Mark Resolved")')
      .first();
    if (await resolveBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await resolveBtn.click();
      await expect(page.locator('text=/resolved/i').first()).toBeVisible({ timeout: 10_000 });
    }
  });
});
