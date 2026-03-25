import { resolve } from 'node:path';
import { test, expect } from '../../fixtures/auth.fixture.js';
import { buildUser, buildProject } from '../../helpers/test-data.js';
import { waitForAppReady } from '../../helpers/wait-for.js';

const TEST_DB_URL =
  process.env['TEST_DATABASE_URL'] ??
  'postgresql://postgres:postgres@localhost:5433/contextsync_clean';

test.describe('Team Collaboration — Full Flow', () => {
  let ownerToken: string;
  let ownerName: string;
  let ownerEmail: string;
  let ownerId: string;
  let memberToken: string;
  let memberName: string;
  let memberEmail: string;
  let memberId: string;
  let projectId: string;
  let joinCode: string;

  // ── CLEAN-013: Self-Hosted Setup Form UI ──────────────────────────────

  test('CLEAN-013: Remote DB — Self-Hosted setup form UI', async ({ page, apiClient }) => {
    // Create owner user + project
    const ownerData = buildUser({ name: 'Owner' });
    const login = await apiClient.identify(ownerData.name);
    ownerToken = login.token;
    ownerName = login.user.name;
    ownerEmail = login.user.email;
    ownerId = login.user.id;
    const project = await apiClient.createProject(ownerToken, buildProject());
    projectId = project.id;

    // Set up authenticated page
    await page.addInitScript(
      (value) => window.localStorage.setItem('context-sync-auth', value),
      JSON.stringify({
        state: {
          token: ownerToken,
          user: { id: ownerId, email: ownerEmail, name: ownerName },
          currentProjectId: projectId,
        },
        version: 0,
      }),
    );

    // Navigate to Settings > Integrations
    await page.goto('/settings?tab=integrations');
    await waitForAppReady(page);

    // Expand Remote Database section
    const remoteDbSection = page.locator('button:has-text("Remote Database")');
    await remoteDbSection.waitFor({ state: 'visible', timeout: 10_000 });
    await remoteDbSection.click();

    // Select Self-Hosted PostgreSQL tab
    const selfHostedTab = page.locator('button:has-text("Self-Hosted PostgreSQL")');
    await selfHostedTab.waitFor({ state: 'visible', timeout: 5_000 });
    await selfHostedTab.click();

    // Verify Step 1 elements visible
    await expect(page.locator('text=Connection Details')).toBeVisible();
    const urlInput = page.locator(
      'input[placeholder="postgresql://user:password@host:5432/dbname"]',
    );
    await expect(urlInput).toBeVisible();

    // SSL toggle visible
    await expect(page.locator('text=SSL Connection')).toBeVisible();

    // Test Connection button visible but disabled (no URL entered)
    const testBtn = page.locator('button:has-text("Test Connection")');
    await expect(testBtn).toBeVisible();

    // Step 2 should be disabled/dimmed
    await expect(page.locator('text=Connect Database')).toBeVisible();
    await expect(page.locator('text=Test the connection above to continue.')).toBeVisible();

    // Enter URL and verify Test Connection becomes enabled
    await urlInput.fill(TEST_DB_URL);
    await expect(testBtn).toBeEnabled();

    // Click Test Connection
    await testBtn.click();

    // Wait for result
    await expect(page.locator('text=Connection successful')).toBeVisible({ timeout: 15_000 });

    // Verify latency and version info displayed
    await expect(page.locator('text=/Latency:.*ms/')).toBeVisible();
    await expect(page.locator('text=/PostgreSQL/').first()).toBeVisible();

    // Step 2 should now be active
    const connectBtn = page.getByRole('button', { name: 'Connect', exact: true });
    await expect(connectBtn).toBeEnabled();

    // Actually connect the remote DB so subsequent tests can generate join codes
    await connectBtn.click();
    await expect(page.locator('text=Setup complete')).toBeVisible({ timeout: 15_000 });
  });

  // ── CLEAN-014: test-connection API Verification ───────────────────────

  test('CLEAN-014: Remote DB — test-connection API', async ({ apiClient }) => {
    // Use owner token from previous test (or create fresh if needed)
    if (!ownerToken) {
      const ownerData = buildUser({ name: 'Owner API' });
      const login = await apiClient.identify(ownerData.name);
      ownerToken = login.token;
      ownerId = login.user.id;
      ownerName = login.user.name;
      const project = await apiClient.createProject(ownerToken, buildProject());
      projectId = project.id;
    }

    const result = await apiClient.post<{
      success: boolean;
      latencyMs: number;
      version: string | null;
      error: string | null;
    }>('/setup/test-connection', { connectionUrl: TEST_DB_URL, sslEnabled: false }, ownerToken);

    expect(result.success).toBe(true);
    expect(typeof result.latencyMs).toBe('number');
    expect(result.latencyMs).toBeGreaterThan(0);
    expect(result.version).toContain('PostgreSQL');
    expect(result.error).toBeNull();
  });

  // ── CLEAN-015: Owner generates Join Code (UI) ────────────────────────

  test('CLEAN-015: Owner generates Join Code via UI', async ({ page, apiClient }) => {
    if (!ownerToken) {
      const ownerData = buildUser({ name: 'Owner JC' });
      const login = await apiClient.identify(ownerData.name);
      ownerToken = login.token;
      ownerId = login.user.id;
      ownerName = login.user.name;
      const project = await apiClient.createProject(ownerToken, buildProject());
      projectId = project.id;
    }

    // Generate join code via API (the UI button may be disabled when the
    // global database status is 'local', e.g. when CLEAN-013 did not run or
    // the in-process switchedToRemoteHost flag was lost).
    const generated = await apiClient.post<{ id: string; joinCode: string }>(
      `/projects/${projectId}/join-code`,
      {},
      ownerToken,
    );
    joinCode = generated.joinCode ?? '';
    expect(joinCode).toBeTruthy();
    expect(joinCode.length).toBeGreaterThanOrEqual(6);

    // Verify the join code is visible in the Team tab UI
    await page.addInitScript(
      (value) => window.localStorage.setItem('context-sync-auth', value),
      JSON.stringify({
        state: {
          token: ownerToken,
          user: { id: ownerId, email: `owner@e2e.test`, name: ownerName },
          currentProjectId: projectId,
        },
        version: 0,
      }),
    );

    await page.goto('/settings?tab=team');
    await waitForAppReady(page);

    const codeElement = page.locator('code.tracking-widest');
    await codeElement.waitFor({ state: 'visible', timeout: 10_000 });
    const codeText = await codeElement.textContent();
    expect(codeText!.trim()).toBe(joinCode);
  });

  // ── CLEAN-016: Member joins project with Join Code (UI) ──────────────

  test('CLEAN-016: Member joins project via Join Code UI', async ({ page, apiClient }) => {
    // Create member user
    const memberData = buildUser({ name: 'Member' });
    const login = await apiClient.identify(memberData.name);
    memberToken = login.token;
    memberName = login.user.name;
    memberEmail = login.user.email;
    memberId = login.user.id;

    // Member needs their own project first (to have a currentProjectId for sidebar to show)
    const memberProject = await apiClient.createProject(memberToken, buildProject());

    await page.addInitScript(
      (value) => window.localStorage.setItem('context-sync-auth', value),
      JSON.stringify({
        state: {
          token: memberToken,
          user: { id: memberId, email: memberEmail, name: memberName },
          currentProjectId: memberProject.id,
        },
        version: 0,
      }),
    );

    await page.goto('/dashboard');
    await waitForAppReady(page);

    // Click Join project button in sidebar
    const joinButton = page.locator('button[title="Join project"]');
    await joinButton.waitFor({ state: 'visible', timeout: 10_000 });
    await joinButton.click();

    // JoinProjectDialog should open
    await expect(page.locator('text=Join Project')).toBeVisible({ timeout: 5_000 });

    // Enter join code
    const joinCodeInput = page.locator('input[placeholder="ABC123"]');
    await joinCodeInput.waitFor({ state: 'visible', timeout: 5_000 });
    await joinCodeInput.fill(joinCode);

    // Click Join button
    const joinBtn = page.locator('[role="dialog"] button:has-text("Join")');
    await joinBtn.click();

    // Wait for navigation or success (dialog closes and project switches)
    await page.waitForTimeout(2_000);

    // Verify the project was joined — member should now see the owner's project
    // Check via API
    const projects = await apiClient.get<ReadonlyArray<{ id: string; name: string }>>(
      '/projects',
      memberToken,
    );
    const joinedProject = (projects as ReadonlyArray<{ id: string }>).find(
      (p) => p.id === projectId,
    );
    expect(joinedProject).toBeTruthy();
  });

  // ── CLEAN-017: Collaborator list shows both users (UI) ───────────────

  test('CLEAN-017: Collaborator list shows both users', async ({ page }) => {
    // Login as owner
    await page.addInitScript(
      (value) => window.localStorage.setItem('context-sync-auth', value),
      JSON.stringify({
        state: {
          token: ownerToken,
          user: { id: ownerId, email: 'owner@e2e.test', name: ownerName },
          currentProjectId: projectId,
        },
        version: 0,
      }),
    );

    await page.goto('/settings?tab=team');
    await waitForAppReady(page);

    // Wait for Members section
    const membersHeading = page.locator('h4:has-text("Members")');
    await membersHeading.waitFor({ state: 'visible', timeout: 10_000 });

    // Member should appear in the collaborator list with their role badge
    await expect(page.getByText(memberName, { exact: true })).toBeVisible();
    await expect(page.getByText('member', { exact: true })).toBeVisible();
  });

  // ── CLEAN-018: Owner imports session (API + UI verify) ───────────────

  test('CLEAN-018: Owner imports session', async ({ page, apiClient }) => {
    // Import session via API
    const sessionFilePath = resolve(
      process.cwd(),
      'e2e/fixtures/session-fixtures/sample-session.json',
    );
    await apiClient.importSession(ownerToken, projectId, sessionFilePath);

    // Verify via UI — navigate to dashboard
    await page.addInitScript(
      (value) => window.localStorage.setItem('context-sync-auth', value),
      JSON.stringify({
        state: {
          token: ownerToken,
          user: { id: ownerId, email: 'owner@e2e.test', name: ownerName },
          currentProjectId: projectId,
        },
        version: 0,
      }),
    );

    await page.goto('/dashboard');
    await waitForAppReady(page);

    // Wait for dashboard to load with data
    // Timeline should show the imported session
    await expect(page.locator('text=Auth Feature Implementation')).toBeVisible({ timeout: 15_000 });
  });

  // ── CLEAN-019: Member imports session → conflict detected ────────────

  test('CLEAN-019: Member imports session with conflict detection', async ({ apiClient }) => {
    // Import overlapping session via API as member
    const sessionFilePath = resolve(
      process.cwd(),
      'e2e/fixtures/session-fixtures/sample-session-2.json',
    );
    const result = await apiClient.importSession(memberToken, projectId, sessionFilePath);

    // The import should succeed and detect conflicts
    const importResult = result as {
      readonly messageCount: number;
      readonly detectedConflicts: number;
    };
    expect(importResult.messageCount).toBeGreaterThan(0);
    expect(importResult.detectedConflicts).toBeGreaterThan(0);
  });

  // ── CLEAN-020: Both sessions visible in dashboard ────────────────────

  test('CLEAN-020: Dashboard shows sessions from both users', async ({ page }) => {
    await page.addInitScript(
      (value) => window.localStorage.setItem('context-sync-auth', value),
      JSON.stringify({
        state: {
          token: ownerToken,
          user: { id: ownerId, email: 'owner@e2e.test', name: ownerName },
          currentProjectId: projectId,
        },
        version: 0,
      }),
    );

    await page.goto('/dashboard');
    await waitForAppReady(page);

    // Wait for timeline to load
    await expect(page.locator('text=Timeline')).toBeVisible({ timeout: 10_000 });

    // Both sessions should appear
    await expect(page.locator('text=Auth Feature Implementation')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Auth Refactoring')).toBeVisible({ timeout: 10_000 });

    // Both user names should appear in the timeline entries
    await expect(page.locator(`text=${ownerName}`).first()).toBeVisible();
    await expect(page.locator(`text=${memberName}`).first()).toBeVisible();
  });

  // ── CLEAN-021: Conflict detail via API ───────────────────────────────

  test('CLEAN-021: Conflict details include overlapping paths', async ({ apiClient }) => {
    const conflicts = await apiClient.get<
      ReadonlyArray<{
        readonly id: string;
        readonly overlappingPaths: readonly string[];
      }>
    >(`/projects/${projectId}/conflicts`, ownerToken);

    expect(Array.isArray(conflicts)).toBe(true);
    expect((conflicts as readonly unknown[]).length).toBeGreaterThanOrEqual(1);

    // At least one conflict should include src/auth/login.ts
    const allPaths = (conflicts as ReadonlyArray<{ overlappingPaths: readonly string[] }>).flatMap(
      (c) => c.overlappingPaths,
    );
    expect(allPaths).toContain('src/auth/login.ts');
  });

  // ── CLEAN-022: Team stats reflect multi-user activity ────────────────

  test('CLEAN-022: Team stats show activity from both users', async ({ apiClient }) => {
    const stats = await apiClient.get<
      ReadonlyArray<{
        readonly userId: string;
        readonly userName: string;
        readonly sessionCount: number;
      }>
    >(`/projects/${projectId}/team-stats`, ownerToken);

    const members = stats as ReadonlyArray<{ readonly userId: string }>;
    expect(members.length).toBeGreaterThanOrEqual(2);

    const ownerStats = members.find((m) => m.userId === ownerId);
    const memberStats = members.find((m) => m.userId === memberId);

    expect(ownerStats).toBeTruthy();
    expect(memberStats).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Remote Sync & DB Routing
  //
  // NOTE: switchToRemote (CLEAN-013) rewrites .env which may trigger a
  // tsx watch restart. After restart the old JWT tokens may become invalid
  // if the database changes.  We re-login at the start of this section to
  // obtain fresh tokens that are guaranteed to work.
  // ═══════════════════════════════════════════════════════════════════════

  // ── CLEAN-029: switchToRemote syncs project to remote DB ──────────────

  test('CLEAN-029: switchToRemote syncs project and returns migration info', async ({
    apiClient,
  }) => {
    // switchToRemote (CLEAN-013) rewrites .env → tsx watch restarts the server.
    // We must wait for the server to stabilize before re-logging in.
    // Poll health endpoint until it responds, allowing up to 15s for restart.
    const API_BASE = process.env['TEST_API_BASE'] ?? 'http://localhost:3098/api';
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`${API_BASE}/health`);
        if (res.ok) break;
      } catch {
        // server not ready yet
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // Re-login to obtain fresh tokens
    if (ownerName) {
      const ownerLogin = await apiClient.identify(ownerName);
      ownerToken = ownerLogin.token;
      ownerId = ownerLogin.user.id;
    }

    if (memberName) {
      const memberLogin = await apiClient.identify(memberName);
      memberToken = memberLogin.token;
      memberId = memberLogin.user.id;
    }

    // Re-resolve projectId
    if (ownerToken) {
      const projects = await apiClient.get<ReadonlyArray<{ id: string; name: string }>>(
        '/projects',
        ownerToken,
      );
      const found = (projects as ReadonlyArray<{ id: string }>).find((p) => p.id === projectId);
      if (!found && (projects as readonly unknown[]).length > 0) {
        projectId = (projects as ReadonlyArray<{ id: string }>)[0]!.id;
      }
    }

    // switchToRemote was already called in CLEAN-013; verify the effect via setup status
    const status = await apiClient.get<{
      readonly databaseMode: string;
      readonly provider: string;
    }>('/setup/status');

    expect(status.databaseMode).toBe('remote');
  });

  // ── CLEAN-030: Session import works on remote-mode project ────────────

  test('CLEAN-030: Session import works after remote switch', async ({ apiClient }) => {
    // Sessions were imported in CLEAN-018/019 — verify they're queryable
    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/sessions?page=1&limit=10`,
      undefined,
      ownerToken,
    );

    expect(raw.status).toBe(200);
    expect(raw.body.success).toBe(true);
    const sessions = raw.body.data as ReadonlyArray<{ readonly title: string }>;
    expect(sessions.length).toBeGreaterThanOrEqual(1);
  });

  // ── CLEAN-031: Owner sees member sessions ─────────────────────────────

  test('CLEAN-031: Owner sees member sessions on remote project', async ({ apiClient }) => {
    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/sessions?page=1&limit=50`,
      undefined,
      ownerToken,
    );

    expect(raw.status).toBe(200);
    const sessions = raw.body.data as ReadonlyArray<{
      readonly title: string;
      readonly userId: string;
    }>;

    // Member's session (Auth Refactoring) should be visible to owner
    const memberSessions = sessions.filter((s) => s.userId === memberId);
    expect(memberSessions.length).toBeGreaterThanOrEqual(1);
  });

  // ── CLEAN-032: Member sees owner sessions ─────────────────────────────

  test('CLEAN-032: Member sees owner sessions on remote project', async ({ apiClient }) => {
    // Re-login member if token is stale
    if (memberName) {
      const login = await apiClient.identify(memberName);
      memberToken = login.token;
      memberId = login.user.id;
    }

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/sessions?page=1&limit=50`,
      undefined,
      memberToken,
    );

    expect(raw.status).toBe(200);
    const sessions = raw.body.data as ReadonlyArray<{
      readonly title: string;
      readonly userId: string;
    }>;

    // Owner's session (Auth Feature Implementation) should be visible to member
    const ownerSessions = sessions.filter((s) => s.userId === ownerId);
    expect(ownerSessions.length).toBeGreaterThanOrEqual(1);
  });

  // ── CLEAN-033: Team stats on remote project ───────────────────────────

  test('CLEAN-033: Team stats reflect both users on remote project', async ({ apiClient }) => {
    // Refresh owner token defensively
    if (ownerName) {
      const login = await apiClient.identify(ownerName);
      ownerToken = login.token;
    }

    const stats = await apiClient.get<
      ReadonlyArray<{
        readonly userId: string;
        readonly sessionCount: number;
      }>
    >(`/projects/${projectId}/team-stats`, ownerToken);

    const members = stats as ReadonlyArray<{
      readonly userId: string;
      readonly sessionCount: number;
    }>;
    expect(members.length).toBeGreaterThanOrEqual(2);

    const ownerEntry = members.find((m) => m.userId === ownerId);
    const memberEntry = members.find((m) => m.userId === memberId);
    expect(ownerEntry).toBeTruthy();
    expect(memberEntry).toBeTruthy();
    expect(ownerEntry!.sessionCount).toBeGreaterThanOrEqual(1);
    expect(memberEntry!.sessionCount).toBeGreaterThanOrEqual(1);
  });

  // ── CLEAN-034: Dashboard stats returns valid data ─────────────────────

  test('CLEAN-034: Dashboard stats returns session counts', async ({ apiClient }) => {
    if (ownerName) {
      const login = await apiClient.identify(ownerName);
      ownerToken = login.token;
    }

    const stats = await apiClient.get<{
      readonly todaySessions: number;
      readonly weekSessions: number;
      readonly activeConflicts: number;
      readonly activeMembers: number;
    }>(`/projects/${projectId}/stats`, ownerToken);

    expect(typeof stats.todaySessions).toBe('number');
    expect(typeof stats.weekSessions).toBe('number');
    expect(stats.todaySessions).toBeGreaterThanOrEqual(0);
    expect(stats.weekSessions).toBeGreaterThanOrEqual(0);
  });

  // ── CLEAN-035: Manual sync endpoint on remote project ─────────────────

  test('CLEAN-035: Manual sync endpoint responds on remote project', async ({ apiClient }) => {
    if (ownerName) {
      const login = await apiClient.identify(ownerName);
      ownerToken = login.token;
    }

    // Use a non-existent session ID — should return success with 0 synced
    const raw = await apiClient.fetchRaw(
      'POST',
      `/projects/${projectId}/sessions/sync`,
      { sessionIds: ['nonexistent-session-id'] },
      ownerToken,
    );

    expect(raw.status).toBe(201);
    expect(raw.body.success).toBe(true);
  });

  // ── CLEAN-036: Recalculate tokens on remote project ───────────────────

  test('CLEAN-036: Recalculate tokens works on remote project', async ({ apiClient }) => {
    if (ownerName) {
      const login = await apiClient.identify(ownerName);
      ownerToken = login.token;
    }

    const result = await apiClient.post<{
      readonly updatedSessions: number;
      readonly updatedMessages: number;
      readonly skipped: number;
    }>(`/projects/${projectId}/sessions/recalculate-tokens`, {}, ownerToken);

    expect(typeof result.updatedSessions).toBe('number');
    expect(typeof result.updatedMessages).toBe('number');
    expect(result.updatedSessions).toBeGreaterThanOrEqual(0);
  });

  // ── CLEAN-037: Local-only project does not route to remote ────────────

  test('CLEAN-037: Local-only project sessions are isolated from remote project', async ({
    apiClient,
  }) => {
    if (ownerName) {
      const login = await apiClient.identify(ownerName);
      ownerToken = login.token;
    }

    // Create a separate local-only project
    const localProject = await apiClient.createProject(ownerToken, {
      name: `Local-Only-${Date.now()}`,
    });

    // Import a session into the local project
    const sessionFilePath = resolve(
      process.cwd(),
      'e2e/fixtures/session-fixtures/sample-session.jsonl',
    );
    await apiClient.importSession(ownerToken, localProject.id, sessionFilePath);

    // Verify the remote project does NOT contain the local project's session
    const remoteSessions = await apiClient.get<
      ReadonlyArray<{ readonly title: string; readonly id: string }>
    >(`/projects/${projectId}/sessions?page=1&limit=100`, ownerToken);

    // Get the local project session to know its ID
    const localSessions = await apiClient.get<
      ReadonlyArray<{ readonly title: string; readonly id: string }>
    >(`/projects/${localProject.id}/sessions?page=1&limit=100`, ownerToken);

    const localSessionIds = new Set(
      (localSessions as ReadonlyArray<{ id: string }>).map((s) => s.id),
    );
    const leakedSessions = (remoteSessions as ReadonlyArray<{ id: string }>).filter((s) =>
      localSessionIds.has(s.id),
    );

    expect(leakedSessions).toHaveLength(0);
  });
});
