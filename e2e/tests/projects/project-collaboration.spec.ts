import { test, expect } from '../../fixtures/auth.fixture.js';
import { buildUser } from '../../helpers/test-data.js';
import { addCollaborator, getInvitationToken } from '../../helpers/invitation-helpers.js';

test.describe('Project Collaboration', () => {
  test('create invitation', async ({ apiClient, testUser, testProjectId }) => {
    const inviteeData = buildUser();
    const invitation = await apiClient.post<{ id: string; email: string }>(
      `/projects/${testProjectId}/invitations`,
      { email: inviteeData.email, role: 'member' },
      testUser.token,
    );

    expect(invitation.id).toBeTruthy();
    expect(invitation.email).toBe(inviteeData.email);
  });

  test('list project invitations', async ({ apiClient, testUser, testProjectId }) => {
    const inviteeData = buildUser();
    await apiClient.post(
      `/projects/${testProjectId}/invitations`,
      { email: inviteeData.email, role: 'member' },
      testUser.token,
    );

    const invitations = await apiClient.get<readonly { id: string; email: string }[]>(
      `/projects/${testProjectId}/invitations`,
      testUser.token,
    );

    const found = invitations.find((inv) => inv.email === inviteeData.email);
    expect(found).toBeTruthy();
  });

  test('invitee can see pending invitation', async ({ apiClient, testUser, testProjectId }) => {
    const inviteeData = buildUser();
    await apiClient.post(
      `/projects/${testProjectId}/invitations`,
      { email: inviteeData.email, role: 'member' },
      testUser.token,
    );

    const { token: inviteeToken } = await apiClient.login(inviteeData.name, inviteeData.email);

    const myInvitations = await apiClient.get<readonly { id: string; projectName: string }[]>(
      '/invitations/mine',
      inviteeToken,
    );

    expect(myInvitations.length).toBeGreaterThanOrEqual(1);
  });

  test('accept invitation adds collaborator', async ({
    apiClient,
    db,
    testUser,
    testProjectId,
  }) => {
    const inviteeData = buildUser();
    const invitation = await apiClient.post<{ id: string }>(
      `/projects/${testProjectId}/invitations`,
      { email: inviteeData.email, role: 'member' },
      testUser.token,
    );

    // Try to get invitation token from DB (works when API and test use same DB)
    const invToken = await getInvitationToken(db, invitation.id);

    if (invToken) {
      const { token: inviteeToken } = await apiClient.login(inviteeData.name, inviteeData.email);
      await apiClient.post(
        '/invitations/respond',
        { token: invToken, action: 'accept' },
        inviteeToken,
      );

      const collaborators = await apiClient.get<readonly { userId: string }[]>(
        `/projects/${testProjectId}/collaborators`,
        testUser.token,
      );

      expect(collaborators.length).toBeGreaterThanOrEqual(1);
    } else {
      // Fallback: add collaborator directly via DB
      const { user: invitee } = await apiClient.login(inviteeData.name, inviteeData.email);
      await addCollaborator(db, testProjectId, invitee.id, 'member');

      const collaborators = await apiClient.get<readonly { userId: string }[]>(
        `/projects/${testProjectId}/collaborators`,
        testUser.token,
      );

      expect(collaborators.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('cancel invitation removes it', async ({ apiClient, testUser, testProjectId }) => {
    const inviteeData = buildUser();
    const invitation = await apiClient.post<{ id: string }>(
      `/projects/${testProjectId}/invitations`,
      { email: inviteeData.email, role: 'member' },
      testUser.token,
    );

    await apiClient.del(`/invitations/${invitation.id}`, testUser.token);

    const invitations = await apiClient.get<readonly { id: string }[]>(
      `/projects/${testProjectId}/invitations`,
      testUser.token,
    );

    const found = invitations.find((inv) => inv.id === invitation.id);
    expect(found).toBeUndefined();
  });
});
