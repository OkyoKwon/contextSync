import { test, expect } from '../../fixtures/auth.fixture.js';
import { buildUser } from '../../helpers/test-data.js';
import { activateRemoteDb } from '../../helpers/invitation-helpers.js';

test.describe('Auto User Upgrade', () => {
  test('upgrade auto user with new email', async ({ apiClient }) => {
    const { token, user: autoUser } = await apiClient.autoLogin();

    const upgradeData = buildUser();
    const result = await apiClient.upgrade(token, {
      name: upgradeData.name,
      email: upgradeData.email,
      autoUserId: autoUser.id,
    });

    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe(upgradeData.email);
    expect(result.user.name).toBe(upgradeData.name);
  });

  test('upgraded user can create invitations', async ({ apiClient, db }) => {
    const { token: autoToken, user: autoUser } = await apiClient.autoLogin();
    const project = await apiClient.createProject(autoToken, { name: 'Upgrade Test Project' });

    // Remote DB must be active before invitations can be created
    await activateRemoteDb(db, project.id);

    // Upgrade the auto user
    const upgradeData = buildUser();
    const { token: upgradedToken } = await apiClient.upgrade(autoToken, {
      name: upgradeData.name,
      email: upgradeData.email,
      autoUserId: autoUser.id,
    });

    // Now should be able to create invitation
    const inviteeData = buildUser();
    const invitation = await apiClient.post<{ id: string; email: string }>(
      `/projects/${project.id}/invitations`,
      { email: inviteeData.email, role: 'member' },
      upgradedToken,
    );

    expect(invitation.id).toBeTruthy();
    expect(invitation.email).toBe(inviteeData.email);
  });

  test('upgrade with existing email merges data', async ({ apiClient }) => {
    // Create an existing user with projects
    const existingData = buildUser();
    const { token: existingToken, user: existingUser } = await apiClient.login(
      existingData.name,
      existingData.email,
    );
    const existingProject = await apiClient.createProject(existingToken, {
      name: 'Existing Project',
    });

    // Create auto user with a project
    const { token: autoToken, user: autoUser } = await apiClient.autoLogin();
    const autoProject = await apiClient.createProject(autoToken, { name: 'Auto Project' });

    // Upgrade auto user using existing user's email
    const result = await apiClient.upgrade(autoToken, {
      name: existingData.name,
      email: existingData.email,
      autoUserId: autoUser.id,
    });

    // Should return the existing user (merged)
    expect(result.user.id).toBe(existingUser.id);
    expect(result.user.email).toBe(existingData.email);

    // Existing user should now own both projects
    const projects = await apiClient.get<readonly { id: string }[]>('/projects', result.token);
    const projectIds = projects.map((p) => p.id);
    expect(projectIds).toContain(existingProject.id);
    expect(projectIds).toContain(autoProject.id);
  });

  test('upgrade already-upgraded user returns error', async ({ apiClient }) => {
    const { token: autoToken, user: autoUser } = await apiClient.autoLogin();

    // Upgrade once
    const upgradeData = buildUser();
    const { token: upgradedToken } = await apiClient.upgrade(autoToken, {
      name: upgradeData.name,
      email: upgradeData.email,
      autoUserId: autoUser.id,
    });

    // Try to upgrade again
    const secondUpgradeData = buildUser();
    const response = await apiClient.fetchRaw(
      'POST',
      '/auth/upgrade',
      {
        name: secondUpgradeData.name,
        email: secondUpgradeData.email,
        autoUserId: autoUser.id,
      },
      upgradedToken,
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('already upgraded');
  });
});
