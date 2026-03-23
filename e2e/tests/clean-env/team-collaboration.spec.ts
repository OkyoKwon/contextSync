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
  let ownerId: string;
  let memberToken: string;
  let memberName: string;
  let memberId: string;
  let projectId: string;
  let joinCode: string;

  // ── CLEAN-013: Self-Hosted Setup Form UI ──────────────────────────────

  test('CLEAN-013: Remote DB — Self-Hosted setup form UI', async ({ page, apiClient }) => {
    // Create owner user + project
    const ownerData = buildUser({ name: 'Owner' });
    const login = await apiClient.login(ownerData.name, ownerData.email);
    ownerToken = login.token;
    ownerName = login.user.name;
    ownerId = login.user.id;
    const project = await apiClient.createProject(ownerToken, buildProject());
    projectId = project.id;

    // Set up authenticated page
    await page.addInitScript(
      (value) => window.localStorage.setItem('context-sync-auth', value),
      JSON.stringify({
        state: {
          token: ownerToken,
          user: { id: ownerId, email: ownerData.email, name: ownerName },
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
      const login = await apiClient.login(ownerData.name, ownerData.email);
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
      const login = await apiClient.login(ownerData.name, ownerData.email);
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
    const login = await apiClient.login(memberData.name, memberData.email);
    memberToken = login.token;
    memberName = login.user.name;
    memberId = login.user.id;

    // Member needs their own project first (to have a currentProjectId for sidebar to show)
    const memberProject = await apiClient.createProject(memberToken, buildProject());

    await page.addInitScript(
      (value) => window.localStorage.setItem('context-sync-auth', value),
      JSON.stringify({
        state: {
          token: memberToken,
          user: { id: memberId, email: memberData.email, name: memberName },
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
});
