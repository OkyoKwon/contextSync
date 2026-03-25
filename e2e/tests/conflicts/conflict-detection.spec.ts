import { test, expect } from '../../fixtures/auth.fixture.js';
import { buildUser, buildProject } from '../../helpers/test-data.js';
import { addCollaborator } from '../../helpers/invitation-helpers.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/session-fixtures',
);

test.describe('Conflict Detection', () => {
  test('overlapping file paths between different users create conflicts', async ({
    apiClient,
    db,
  }) => {
    const userAData = buildUser();
    const { token: tokenA } = await apiClient.identify(userAData.name);
    const project = await apiClient.createProject(
      tokenA,
      buildProject({ name: 'Conflict Test Project' }),
    );

    const userBData = buildUser();
    const { token: tokenB, user: userB } = await apiClient.identify(userBData.name);

    // Add userB as collaborator directly
    await addCollaborator(db, project.id, userB.id, 'member');

    // UserA imports session with paths: src/auth/login.ts, src/utils/validators.ts, src/auth/middleware.ts
    await apiClient.importSession(tokenA, project.id, resolve(fixturesDir, 'sample-session.json'));

    // UserB imports session with overlapping paths: src/auth/login.ts, src/auth/register.ts, src/auth/middleware.ts
    await apiClient.importSession(
      tokenB,
      project.id,
      resolve(fixturesDir, 'sample-session-2.json'),
    );

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${project.id}/conflicts`,
      undefined,
      tokenA,
    );

    expect(raw.body.success).toBe(true);
    const conflicts = raw.body.data as readonly { id: string; overlappingPaths: string[] }[];
    expect(conflicts.length).toBeGreaterThanOrEqual(1);
  });

  test('non-overlapping file paths produce no conflicts', async ({ apiClient, db }) => {
    const userAData = buildUser();
    const { token: tokenA } = await apiClient.identify(userAData.name);
    const project = await apiClient.createProject(
      tokenA,
      buildProject({ name: 'No Conflict Project' }),
    );

    const userBData = buildUser();
    const { token: tokenB, user: userB } = await apiClient.identify(userBData.name);

    await addCollaborator(db, project.id, userB.id, 'member');

    await apiClient.importSession(tokenA, project.id, resolve(fixturesDir, 'sample-session.json'));
    await apiClient.importSession(tokenB, project.id, resolve(fixturesDir, 'sample-session.jsonl'));

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${project.id}/conflicts`,
      undefined,
      tokenA,
    );

    expect(raw.body.success).toBe(true);
    const conflicts = raw.body.data as readonly unknown[];
    expect(conflicts.length).toBe(0);
  });

  test('conflict severity is valid for overlapping files', async ({ apiClient, db }) => {
    const userAData = buildUser();
    const { token: tokenA } = await apiClient.identify(userAData.name);
    const project = await apiClient.createProject(
      tokenA,
      buildProject({ name: 'Severity Project' }),
    );

    const userBData = buildUser();
    const { token: tokenB, user: userB } = await apiClient.identify(userBData.name);

    await addCollaborator(db, project.id, userB.id, 'member');

    await apiClient.importSession(tokenA, project.id, resolve(fixturesDir, 'sample-session.json'));
    await apiClient.importSession(
      tokenB,
      project.id,
      resolve(fixturesDir, 'sample-session-2.json'),
    );

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${project.id}/conflicts`,
      undefined,
      tokenA,
    );

    const conflicts = raw.body.data as readonly { severity: string }[];
    if (conflicts.length > 0) {
      expect(['info', 'warning', 'critical']).toContain(conflicts[0]!.severity);
    }
  });
});
