import { sql } from 'kysely';
import { test, expect } from '../../fixtures/auth.fixture.js';
import { buildUser } from '../../helpers/test-data.js';

test.describe('Auto User', () => {
  test('auto login creates user with is_auto=true', async ({ apiClient }) => {
    const result = await apiClient.autoLogin();

    expect(result.token).toBeTruthy();
    expect(result.user.id).toBeTruthy();
    expect(result.user.email).toContain('@local');
    expect(result.user.name).toBe('Local User');
  });

  test('auto user can create project', async ({ apiClient }) => {
    const { token } = await apiClient.autoLogin();
    const project = await apiClient.createProject(token, { name: 'Auto User Project' });

    expect(project.id).toBeTruthy();
    expect(project.name).toBe('Auto User Project');
  });

  test('auto user can generate join codes as project owner', async ({ apiClient }) => {
    const { token } = await apiClient.autoLogin();
    const project = await apiClient.createProject(token, { name: 'Test Project' });

    const response = await apiClient.fetchRaw(
      'POST',
      `/projects/${project.id}/join-code`,
      {},
      token,
    );

    expect(response.status).toBe(201);
    expect(response.body.data.joinCode).toBeTruthy();
  });

  test('auto user is blocked from removing collaborators', async ({ apiClient, db }) => {
    const { token: autoToken } = await apiClient.autoLogin();
    const project = await apiClient.createProject(autoToken, { name: 'Test Project' });

    // Add a collaborator directly via raw SQL (db is Kysely<unknown>)
    const collaboratorData = buildUser();
    const { user: collaborator } = await apiClient.login(
      collaboratorData.name,
      collaboratorData.email,
    );
    await sql`INSERT INTO project_collaborators (project_id, user_id, role)
              VALUES (${project.id}, ${collaborator.id}, 'member')`.execute(db);

    const response = await apiClient.fetchRaw(
      'DELETE',
      `/projects/${project.id}/collaborators/${collaborator.id}`,
      undefined,
      autoToken,
    );

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('account upgrade');
  });
});
