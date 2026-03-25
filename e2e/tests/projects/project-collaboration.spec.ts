import { test, expect } from '../../fixtures/auth.fixture.js';
import { buildUser } from '../../helpers/test-data.js';

test.describe('Project Collaboration', () => {
  test('generate join code', async ({ apiClient, testUser, testProjectId }) => {
    const project = await apiClient.post<{ id: string; joinCode: string }>(
      `/projects/${testProjectId}/join-code`,
      {},
      testUser.token,
    );

    expect(project.joinCode).toBeTruthy();
    expect(project.joinCode.length).toBe(6);
  });

  test('join project by code', async ({ apiClient, testUser, testProjectId }) => {
    // Generate join code
    const project = await apiClient.post<{ joinCode: string }>(
      `/projects/${testProjectId}/join-code`,
      {},
      testUser.token,
    );

    // Create a new user and join
    const inviteeData = buildUser();
    const { token: inviteeToken } = await apiClient.identify(inviteeData.name);
    const joined = await apiClient.post<{ id: string }>(
      '/projects/join',
      { code: project.joinCode },
      inviteeToken,
    );

    expect(joined.id).toBe(testProjectId);

    // Verify collaborator appears
    const collaborators = await apiClient.get<readonly { userId: string }[]>(
      `/projects/${testProjectId}/collaborators`,
      testUser.token,
    );
    expect(collaborators.length).toBeGreaterThanOrEqual(1);
  });

  test('regenerate join code', async ({ apiClient, testUser, testProjectId }) => {
    const first = await apiClient.post<{ joinCode: string }>(
      `/projects/${testProjectId}/join-code`,
      {},
      testUser.token,
    );

    const second = await apiClient.post<{ joinCode: string }>(
      `/projects/${testProjectId}/join-code/regenerate`,
      {},
      testUser.token,
    );

    expect(second.joinCode).toBeTruthy();
    expect(second.joinCode).not.toBe(first.joinCode);
  });

  test('delete join code disables joining', async ({ apiClient, testUser, testProjectId }) => {
    const project = await apiClient.post<{ joinCode: string }>(
      `/projects/${testProjectId}/join-code`,
      {},
      testUser.token,
    );

    await apiClient.del(`/projects/${testProjectId}/join-code`, testUser.token);

    // Attempt to join with old code should fail
    const inviteeData = buildUser();
    const { token: inviteeToken } = await apiClient.identify(inviteeData.name);
    const response = await apiClient.fetchRaw(
      'POST',
      '/projects/join',
      { code: project.joinCode },
      inviteeToken,
    );

    expect(response.status).toBe(404);
  });

  test('invalid join code returns 404', async ({ apiClient, testUser }) => {
    const inviteeData = buildUser();
    const { token: inviteeToken } = await apiClient.identify(inviteeData.name);

    const response = await apiClient.fetchRaw(
      'POST',
      '/projects/join',
      { code: 'XXXXXX' },
      inviteeToken,
    );

    expect(response.status).toBe(404);
  });
});
