import type { Kysely } from 'kysely';
import { test, expect } from '../../fixtures/auth.fixture.js';
import { buildUser, buildProject } from '../../helpers/test-data.js';
import { addCollaborator } from '../../helpers/invitation-helpers.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ApiClient } from '../../fixtures/api.fixture.js';

const fixturesDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/session-fixtures',
);

interface ConflictItem {
  readonly id: string;
  readonly status: string;
  readonly severity: string;
  readonly reviewerId: string | null;
  readonly reviewNotes: string | null;
}

async function setupConflict(apiClient: ApiClient, db: Kysely<unknown>) {
  const userAData = buildUser();
  const { token: tokenA, user: userA } = await apiClient.login(userAData.name, userAData.email);
  const project = await apiClient.createProject(tokenA, buildProject());

  const userBData = buildUser();
  const { token: tokenB, user: userB } = await apiClient.login(userBData.name, userBData.email);

  await addCollaborator(db, project.id, userB.id, 'member');

  await apiClient.importSession(tokenA, project.id, resolve(fixturesDir, 'sample-session.json'));
  await apiClient.importSession(tokenB, project.id, resolve(fixturesDir, 'sample-session-2.json'));

  return { tokenA, tokenB, userA, userB, projectId: project.id };
}

test.describe('Conflicts API', () => {
  test('list conflicts with pagination', async ({ apiClient, db }) => {
    const { tokenA, projectId } = await setupConflict(apiClient, db);

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/conflicts?page=1&limit=10`,
      undefined,
      tokenA,
    );

    expect(raw.body.success).toBe(true);
    expect(raw.body.meta).toBeDefined();
    expect(raw.body.meta!.page).toBe(1);
  });

  test('get conflict detail', async ({ apiClient, db }) => {
    const { tokenA, projectId } = await setupConflict(apiClient, db);

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/conflicts`,
      undefined,
      tokenA,
    );

    const conflicts = raw.body.data as readonly ConflictItem[];
    if (conflicts.length === 0) return;

    const detail = await apiClient.get<ConflictItem>(`/conflicts/${conflicts[0]!.id}`, tokenA);

    expect(detail.id).toBe(conflicts[0]!.id);
    expect(detail.status).toBeTruthy();
  });

  test('update conflict status', async ({ apiClient, db }) => {
    const { tokenA, projectId } = await setupConflict(apiClient, db);

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/conflicts`,
      undefined,
      tokenA,
    );

    const conflicts = raw.body.data as readonly ConflictItem[];
    if (conflicts.length === 0) return;

    const updated = await apiClient.patch<ConflictItem>(
      `/conflicts/${conflicts[0]!.id}`,
      { status: 'resolved' },
      tokenA,
    );

    expect(updated.status).toBe('resolved');
  });

  test('assign reviewer to conflict', async ({ apiClient, db }) => {
    const { tokenA, userB, projectId } = await setupConflict(apiClient, db);

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/conflicts`,
      undefined,
      tokenA,
    );

    const conflicts = raw.body.data as readonly ConflictItem[];
    if (conflicts.length === 0) return;

    const assigned = await apiClient.patch<ConflictItem>(
      `/conflicts/${conflicts[0]!.id}/assign`,
      { reviewerId: userB.id },
      tokenA,
    );

    expect(assigned.reviewerId).toBe(userB.id);
  });

  test('add review notes to conflict', async ({ apiClient, db }) => {
    const { tokenA, projectId } = await setupConflict(apiClient, db);

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/conflicts`,
      undefined,
      tokenA,
    );

    const conflicts = raw.body.data as readonly ConflictItem[];
    if (conflicts.length === 0) return;

    const noted = await apiClient.patch<ConflictItem>(
      `/conflicts/${conflicts[0]!.id}/review-notes`,
      { reviewNotes: 'Reviewed and approved the changes' },
      tokenA,
    );

    expect(noted.reviewNotes).toBe('Reviewed and approved the changes');
  });
});
