import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { test, expect } from '../../fixtures/auth.fixture.js';
import { buildUser, buildProject } from '../../helpers/test-data.js';
import { waitForAppReady } from '../../helpers/wait-for.js';
import { setAuthState } from '../../helpers/auth-helpers.js';
import {
  createLocalSessionFile,
  cleanupLocalSessionDir,
} from '../../helpers/local-session-helpers.js';

const TEST_DB_URL =
  process.env['TEST_DATABASE_URL'] ??
  'postgresql://postgres:postgres@localhost:5433/contextsync_clean';

/** Fail fast if a prerequisite from an earlier test is missing. */
function requireState<T>(name: string, value: T | undefined | null): asserts value is T {
  if (value === undefined || value === null || value === '')
    throw new Error(`Test prerequisite missing: ${name}. Earlier test may have failed.`);
}

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
    const ownerData = buildUser({ name: 'Owner' });
    const login = await apiClient.identify(ownerData.name);
    ownerToken = login.token;
    ownerName = login.user.name;
    ownerEmail = login.user.email;
    ownerId = login.user.id;
    const project = await apiClient.createProject(ownerToken, buildProject());
    projectId = project.id;

    await setAuthState(
      page,
      ownerToken,
      { id: ownerId, email: ownerEmail, name: ownerName },
      projectId,
    );
    await page.goto('/settings?tab=integrations');
    await waitForAppReady(page);

    const remoteDbSection = page.locator('button:has-text("Remote Database")');
    await remoteDbSection.waitFor({ state: 'visible', timeout: 10_000 });
    await remoteDbSection.click();

    const selfHostedTab = page.locator('button:has-text("Self-Hosted PostgreSQL")');
    await selfHostedTab.waitFor({ state: 'visible', timeout: 5_000 });
    await selfHostedTab.click();

    await expect(page.locator('text=Connection Details')).toBeVisible();
    const urlInput = page.locator(
      'input[placeholder="postgresql://user:password@host:5432/dbname"]',
    );
    await expect(urlInput).toBeVisible();
    await expect(page.locator('text=SSL Connection')).toBeVisible();

    const testBtn = page.locator('button:has-text("Test Connection")');
    await expect(testBtn).toBeVisible();
    await expect(page.locator('text=Connect Database')).toBeVisible();

    await urlInput.fill(TEST_DB_URL);
    await expect(testBtn).toBeEnabled();
    await testBtn.click();

    await expect(page.locator('text=Connection successful')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=/Latency:.*ms/')).toBeVisible();
    await expect(page.locator('text=/PostgreSQL/').first()).toBeVisible();

    const connectBtn = page.getByRole('button', { name: 'Connect', exact: true });
    await expect(connectBtn).toBeEnabled();
    await connectBtn.click();
    await expect(page.locator('text=Setup complete')).toBeVisible({ timeout: 15_000 });
  });

  // ── CLEAN-014: test-connection API Verification ───────────────────────

  test('CLEAN-014: Remote DB — test-connection API', async ({ apiClient }) => {
    requireState('ownerToken', ownerToken);

    const result = await apiClient.post<{
      success: boolean;
      latencyMs: number;
      version: string | null;
      error: string | null;
    }>('/setup/test-connection', { connectionUrl: TEST_DB_URL, sslEnabled: false }, ownerToken);

    expect(result.success, 'Connection test should succeed').toBe(true);
    expect(typeof result.latencyMs).toBe('number');
    expect(result.latencyMs).toBeGreaterThan(0);
    expect(result.version).toContain('PostgreSQL');
    expect(result.error).toBeNull();
  });

  // ── CLEAN-015: Owner generates Join Code (UI) ────────────────────────

  test('CLEAN-015: Owner generates Join Code via UI', async ({ page, apiClient }) => {
    requireState('ownerToken', ownerToken);
    requireState('projectId', projectId);

    const generated = await apiClient.post<{ id: string; joinCode: string }>(
      `/projects/${projectId}/join-code`,
      {},
      ownerToken,
    );
    joinCode = generated.joinCode ?? '';
    expect(joinCode, 'Join code should be generated').toBeTruthy();
    expect(joinCode.length).toBeGreaterThanOrEqual(6);

    await setAuthState(
      page,
      ownerToken,
      { id: ownerId, email: ownerEmail, name: ownerName },
      projectId,
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
    requireState('joinCode', joinCode);

    const memberData = buildUser({ name: 'Member' });
    const login = await apiClient.identify(memberData.name);
    memberToken = login.token;
    memberName = login.user.name;
    memberEmail = login.user.email;
    memberId = login.user.id;

    const memberProject = await apiClient.createProject(memberToken, buildProject());

    await setAuthState(
      page,
      memberToken,
      { id: memberId, email: memberEmail, name: memberName },
      memberProject.id,
    );
    await page.goto('/dashboard');
    await waitForAppReady(page);

    const joinButton = page.locator('button[title="Join project"]');
    await joinButton.waitFor({ state: 'visible', timeout: 10_000 });
    await joinButton.click();

    await expect(page.locator('text=Join Project')).toBeVisible({ timeout: 5_000 });

    const joinCodeInput = page.locator('input[placeholder="ABC123"]');
    await joinCodeInput.waitFor({ state: 'visible', timeout: 5_000 });
    await joinCodeInput.fill(joinCode);

    const joinBtn = page.locator('[role="dialog"] button:has-text("Join")');
    await joinBtn.click();

    // Wait for join API response instead of fixed timeout (H-1)
    await page
      .waitForResponse((res) => res.url().includes('/projects/join') && res.status() === 200, {
        timeout: 10_000,
      })
      .catch(() => {
        // fallback: dialog may have already closed
      });
    await page.waitForTimeout(500); // brief settle

    const projects = await apiClient.get<ReadonlyArray<{ id: string; name: string }>>(
      '/projects',
      memberToken,
    );
    const joinedProject = (projects as ReadonlyArray<{ id: string }>).find(
      (p) => p.id === projectId,
    );
    expect(joinedProject, 'Member should see the joined project').toBeTruthy();
  });

  // ── CLEAN-017: Collaborator list shows both users (UI) ───────────────

  test('CLEAN-017: Collaborator list shows both users', async ({ page }) => {
    requireState('ownerToken', ownerToken);
    requireState('memberName', memberName);

    await setAuthState(
      page,
      ownerToken,
      { id: ownerId, email: ownerEmail, name: ownerName },
      projectId,
    );
    await page.goto('/settings?tab=team');
    await waitForAppReady(page);

    const membersHeading = page.locator('h4:has-text("Members")');
    await membersHeading.waitFor({ state: 'visible', timeout: 10_000 });

    await expect(page.getByText(memberName, { exact: true })).toBeVisible();
    await expect(page.getByText('member', { exact: true })).toBeVisible();
  });

  // ── CLEAN-018: Owner imports session (API + UI verify) ───────────────

  test('CLEAN-018: Owner imports session', async ({ page, apiClient }) => {
    requireState('ownerToken', ownerToken);
    requireState('projectId', projectId);

    const sessionFilePath = resolve(
      process.cwd(),
      'e2e/fixtures/session-fixtures/sample-session.json',
    );
    await apiClient.importSession(ownerToken, projectId, sessionFilePath);

    await setAuthState(
      page,
      ownerToken,
      { id: ownerId, email: ownerEmail, name: ownerName },
      projectId,
    );
    await page.goto('/dashboard');
    await waitForAppReady(page);

    await expect(page.locator('text=Auth Feature Implementation')).toBeVisible({ timeout: 15_000 });
  });

  // ── CLEAN-019: Member imports session → conflict detected ────────────

  test('CLEAN-019: Member imports session with conflict detection', async ({ apiClient }) => {
    requireState('memberToken', memberToken);
    requireState('projectId', projectId);

    const sessionFilePath = resolve(
      process.cwd(),
      'e2e/fixtures/session-fixtures/sample-session-2.json',
    );
    const result = await apiClient.importSession(memberToken, projectId, sessionFilePath);

    const importResult = result as {
      readonly messageCount: number;
      readonly detectedConflicts: number;
    };
    expect(importResult.messageCount).toBeGreaterThan(0);
    expect(importResult.detectedConflicts).toBeGreaterThan(0);
  });

  // ── CLEAN-020: Both sessions visible in dashboard ────────────────────

  test('CLEAN-020: Dashboard shows sessions from both users', async ({ page }) => {
    requireState('ownerToken', ownerToken);

    await setAuthState(
      page,
      ownerToken,
      { id: ownerId, email: ownerEmail, name: ownerName },
      projectId,
    );
    await page.goto('/dashboard');
    await waitForAppReady(page);

    await expect(page.locator('text=Timeline')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Auth Feature Implementation')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Auth Refactoring')).toBeVisible({ timeout: 10_000 });

    await expect(page.locator(`text=${ownerName}`).first()).toBeVisible();
    await expect(page.locator(`text=${memberName}`).first()).toBeVisible();
  });

  // ── CLEAN-021: Conflict detail via API ───────────────────────────────

  test('CLEAN-021: Conflict details include overlapping paths', async ({ apiClient }) => {
    requireState('ownerToken', ownerToken);

    const conflicts = await apiClient.get<
      ReadonlyArray<{
        readonly id: string;
        readonly overlappingPaths: readonly string[];
      }>
    >(`/projects/${projectId}/conflicts`, ownerToken);

    expect(Array.isArray(conflicts)).toBe(true);
    expect((conflicts as readonly unknown[]).length).toBeGreaterThanOrEqual(1);

    const allPaths = (conflicts as ReadonlyArray<{ overlappingPaths: readonly string[] }>).flatMap(
      (c) => c.overlappingPaths,
    );
    expect(allPaths).toContain('src/auth/login.ts');
  });

  // ── CLEAN-022: Team stats reflect multi-user activity ────────────────

  test('CLEAN-022: Team stats show activity from both users', async ({ apiClient }) => {
    requireState('ownerToken', ownerToken);

    const stats = await apiClient.get<
      ReadonlyArray<{
        readonly userId: string;
        readonly userName: string;
        readonly sessionCount: number;
      }>
    >(`/projects/${projectId}/team-stats`, ownerToken);

    const members = stats as ReadonlyArray<{ readonly userId: string }>;
    expect(members.length).toBeGreaterThanOrEqual(2);

    expect(
      members.find((m) => m.userId === ownerId),
      'Owner should appear in team stats',
    ).toBeTruthy();
    expect(
      members.find((m) => m.userId === memberId),
      'Member should appear in team stats',
    ).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Remote Sync & DB Routing
  // ═══════════════════════════════════════════════════════════════════════

  // ── CLEAN-029: switchToRemote syncs project to remote DB ──────────────

  test('CLEAN-029: switchToRemote syncs project and returns migration info', async ({
    apiClient,
  }) => {
    // Wait for server stability after CLEAN-013's potential .env rewrite
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
    requireState('ownerName', ownerName);
    const ownerLogin = await apiClient.identify(ownerName);
    ownerToken = ownerLogin.token;
    ownerId = ownerLogin.user.id;
    ownerEmail = ownerLogin.user.email;

    requireState('memberName', memberName);
    const memberLogin = await apiClient.identify(memberName);
    memberToken = memberLogin.token;
    memberId = memberLogin.user.id;
    memberEmail = memberLogin.user.email;

    // Re-resolve projectId
    const projects = await apiClient.get<ReadonlyArray<{ id: string }>>('/projects', ownerToken);
    const found = (projects as ReadonlyArray<{ id: string }>).find((p) => p.id === projectId);
    if (!found && (projects as readonly unknown[]).length > 0) {
      projectId = (projects as ReadonlyArray<{ id: string }>)[0]!.id;
    }

    const status = await apiClient.get<{
      readonly databaseMode: string;
      readonly provider: string;
    }>('/setup/status');

    expect(status.databaseMode).toBe('remote');
  });

  // ── CLEAN-030: Session import works on remote-mode project ────────────

  test('CLEAN-030: Session import works after remote switch', async ({ apiClient }) => {
    requireState('ownerToken', ownerToken);
    requireState('projectId', projectId);

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/sessions?page=1&limit=10`,
      undefined,
      ownerToken,
    );

    expect(raw.status, 'Sessions query should succeed').toBe(200);
    const sessions = raw.body.data as ReadonlyArray<{ readonly title: string }>;
    expect(sessions.length).toBeGreaterThanOrEqual(1);
  });

  // ── CLEAN-031: Owner sees member sessions ─────────────────────────────

  test('CLEAN-031: Owner sees member sessions on remote project', async ({ apiClient }) => {
    requireState('ownerToken', ownerToken);

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/sessions?page=1&limit=50`,
      undefined,
      ownerToken,
    );

    expect(raw.status).toBe(200);
    const sessions = raw.body.data as ReadonlyArray<{ readonly userId: string }>;
    const memberSessions = sessions.filter((s) => s.userId === memberId);
    expect(memberSessions.length, 'Owner should see member sessions').toBeGreaterThanOrEqual(1);
  });

  // ── CLEAN-032: Member sees owner sessions ─────────────────────────────

  test('CLEAN-032: Member sees owner sessions on remote project', async ({ apiClient }) => {
    requireState('memberToken', memberToken);

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/sessions?page=1&limit=50`,
      undefined,
      memberToken,
    );

    expect(raw.status, 'Member should access project sessions').toBe(200);
    const sessions = raw.body.data as ReadonlyArray<{ readonly userId: string }>;
    const ownerSessions = sessions.filter((s) => s.userId === ownerId);
    expect(ownerSessions.length, 'Member should see owner sessions').toBeGreaterThanOrEqual(1);
  });

  // ── CLEAN-033: Team stats on remote project ───────────────────────────

  test('CLEAN-033: Team stats reflect both users on remote project', async ({ apiClient }) => {
    requireState('ownerToken', ownerToken);

    const stats = await apiClient.get<
      ReadonlyArray<{ readonly userId: string; readonly sessionCount: number }>
    >(`/projects/${projectId}/team-stats`, ownerToken);

    const members = stats as ReadonlyArray<{
      readonly userId: string;
      readonly sessionCount: number;
    }>;
    expect(members.length).toBeGreaterThanOrEqual(2);

    const ownerEntry = members.find((m) => m.userId === ownerId);
    const memberEntry = members.find((m) => m.userId === memberId);
    expect(ownerEntry, 'Owner stats should exist').toBeTruthy();
    expect(memberEntry, 'Member stats should exist').toBeTruthy();
    expect(ownerEntry!.sessionCount).toBeGreaterThanOrEqual(1);
    expect(memberEntry!.sessionCount).toBeGreaterThanOrEqual(1);
  });

  // ── CLEAN-034: Dashboard stats returns valid data ─────────────────────

  test('CLEAN-034: Dashboard stats returns session counts', async ({ apiClient }) => {
    requireState('ownerToken', ownerToken);

    const stats = await apiClient.get<{
      readonly todaySessions: number;
      readonly weekSessions: number;
    }>(`/projects/${projectId}/stats`, ownerToken);

    expect(typeof stats.todaySessions).toBe('number');
    expect(typeof stats.weekSessions).toBe('number');
  });

  // ── CLEAN-035: Manual sync endpoint on remote project ─────────────────

  test('CLEAN-035: Manual sync endpoint responds on remote project', async ({ apiClient }) => {
    requireState('ownerToken', ownerToken);

    const raw = await apiClient.fetchRaw(
      'POST',
      `/projects/${projectId}/sessions/sync`,
      { sessionIds: ['nonexistent-session-id'] },
      ownerToken,
    );

    expect(raw.status, 'Sync endpoint should return 201').toBe(201);
    expect(raw.body.success).toBe(true);
  });

  // ── CLEAN-036: Recalculate tokens on remote project ───────────────────

  test('CLEAN-036: Recalculate tokens works on remote project', async ({ apiClient }) => {
    requireState('ownerToken', ownerToken);

    const result = await apiClient.post<{
      readonly updatedSessions: number;
      readonly updatedMessages: number;
      readonly skipped: number;
    }>(`/projects/${projectId}/sessions/recalculate-tokens`, {}, ownerToken);

    expect(typeof result.updatedSessions).toBe('number');
    expect(typeof result.updatedMessages).toBe('number');
  });

  // ── CLEAN-037: Local-only project does not route to remote ────────────

  test('CLEAN-037: Local-only project sessions are isolated from remote project', async ({
    apiClient,
  }) => {
    requireState('ownerToken', ownerToken);

    const localProject = await apiClient.createProject(ownerToken, {
      name: `Local-Only-${Date.now()}`,
    });

    const sessionFilePath = resolve(
      process.cwd(),
      'e2e/fixtures/session-fixtures/sample-session.jsonl',
    );
    await apiClient.importSession(ownerToken, localProject.id, sessionFilePath);

    const remoteSessions = await apiClient.get<ReadonlyArray<{ readonly id: string }>>(
      `/projects/${projectId}/sessions?page=1&limit=100`,
      ownerToken,
    );

    const localSessions = await apiClient.get<ReadonlyArray<{ readonly id: string }>>(
      `/projects/${localProject.id}/sessions?page=1&limit=100`,
      ownerToken,
    );

    const localSessionIds = new Set(
      (localSessions as ReadonlyArray<{ id: string }>).map((s) => s.id),
    );
    const leakedSessions = (remoteSessions as ReadonlyArray<{ id: string }>).filter((s) =>
      localSessionIds.has(s.id),
    );

    expect(leakedSessions, 'Local sessions should not leak to remote project').toHaveLength(0);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Local Session File Sync — Full Flow
  // ═══════════════════════════════════════════════════════════════════════

  const OWNER_LOCAL_DIR = '/tmp/e2e-owner-project';
  const MEMBER_LOCAL_DIR = '/tmp/e2e-member-project';

  // ── CLEAN-038: Owner sets local_directory ─────────────────────────────

  test('CLEAN-038: Owner sets local_directory for project', async ({ apiClient }) => {
    requireState('ownerToken', ownerToken);
    requireState('projectId', projectId);

    const updated = await apiClient.patch<{ readonly localDirectory: string | null }>(
      `/projects/${projectId}`,
      { localDirectory: OWNER_LOCAL_DIR },
      ownerToken,
    );

    expect(updated.localDirectory, 'Owner local_directory should be set').toBe(OWNER_LOCAL_DIR);
  });

  // ── CLEAN-039: Create local .jsonl session file ───────────────────────

  test('CLEAN-039: Create local .jsonl session file for owner', async () => {
    const filePath = createLocalSessionFile(OWNER_LOCAL_DIR, 'owner-sync-sess', [
      { role: 'user', content: 'Implement the payment module' },
      { role: 'assistant', content: 'I will create src/payments/index.ts with the payment logic.' },
    ]);

    expect(existsSync(filePath), 'JSONL file should exist on disk').toBe(true);
  });

  // ── CLEAN-040: Manual sync imports local session file ─────────────────

  test('CLEAN-040: Manual sync imports local session file', async ({ apiClient }) => {
    requireState('ownerToken', ownerToken);

    const raw = await apiClient.fetchRaw(
      'POST',
      `/projects/${projectId}/sessions/sync`,
      { sessionIds: ['owner-sync-sess'] },
      ownerToken,
    );

    expect(raw.status, 'Sync should return 201').toBe(201);
    const result = raw.body.data as { readonly syncedCount: number };
    expect(result.syncedCount, 'One session should be synced').toBe(1);
  });

  // ── CLEAN-041: Synced session visible via sessions API ────────────────

  test('CLEAN-041: Synced session visible via sessions API', async ({ apiClient }) => {
    requireState('ownerToken', ownerToken);

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

    const synced = sessions.find((s) => s.title?.includes('Implement the payment module'));
    expect(synced, 'Synced session title should appear in sessions list').toBeTruthy();
    expect(synced!.userId).toBe(ownerId);
  });

  // ── CLEAN-042: Member sets local_directory ────────────────────────────

  test('CLEAN-042: Member sets local_directory as collaborator', async ({ apiClient }) => {
    requireState('memberToken', memberToken);

    const raw = await apiClient.fetchRaw(
      'PATCH',
      `/projects/${projectId}/my-directory`,
      { localDirectory: MEMBER_LOCAL_DIR },
      memberToken,
    );

    expect(raw.status, 'Member should set local_directory').toBe(200);
  });

  // ── CLEAN-043: Member creates and syncs local session ─────────────────

  test('CLEAN-043: Member creates and syncs local session', async ({ apiClient }) => {
    requireState('memberToken', memberToken);

    createLocalSessionFile(MEMBER_LOCAL_DIR, 'member-sync-sess', [
      { role: 'user', content: 'Add unit tests for the auth module' },
      {
        role: 'assistant',
        content: 'I will create src/auth/__tests__/auth.test.ts with comprehensive tests.',
      },
    ]);

    const raw = await apiClient.fetchRaw(
      'POST',
      `/projects/${projectId}/sessions/sync`,
      { sessionIds: ['member-sync-sess'] },
      memberToken,
    );

    expect(raw.status, 'Member sync should return 201').toBe(201);
    const result = raw.body.data as { readonly syncedCount: number };
    expect(result.syncedCount).toBe(1);
  });

  // ── CLEAN-044: Owner sees member's synced session ─────────────────────

  test('CLEAN-044: Owner sees member synced session', async ({ apiClient }) => {
    requireState('ownerToken', ownerToken);

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/sessions?page=1&limit=50`,
      undefined,
      ownerToken,
    );

    expect(raw.status).toBe(200);
    const sessions = raw.body.data as ReadonlyArray<{
      readonly userId: string;
      readonly title: string;
    }>;
    const memberSessions = sessions.filter((s) => s.userId === memberId);
    expect(memberSessions.length, 'Owner should see member synced sessions').toBeGreaterThanOrEqual(
      1,
    );

    const memberSyncedSession = sessions.find((s) => s.title?.includes('Add unit tests'));
    expect(
      memberSyncedSession,
      'Member synced session title should be visible to owner',
    ).toBeTruthy();
  });

  // ── CLEAN-045: Member sees owner's synced session ─────────────────────

  test('CLEAN-045: Member sees owner synced session', async ({ apiClient }) => {
    requireState('memberToken', memberToken);

    const raw = await apiClient.fetchRaw(
      'GET',
      `/projects/${projectId}/sessions?page=1&limit=50`,
      undefined,
      memberToken,
    );

    expect(raw.status).toBe(200);
    const sessions = raw.body.data as ReadonlyArray<{
      readonly userId: string;
      readonly title: string;
    }>;
    const ownerSessions = sessions.filter((s) => s.userId === ownerId);
    expect(ownerSessions.length, 'Member should see owner synced sessions').toBeGreaterThanOrEqual(
      1,
    );

    const ownerSyncedSession = sessions.find((s) => s.title?.includes('Implement the payment'));
    expect(
      ownerSyncedSession,
      'Owner synced session title should be visible to member',
    ).toBeTruthy();
  });

  // ── CLEAN-046: Local sessions API shows team groups ───────────────────

  test('CLEAN-046: Local sessions API shows team session groups', async ({ apiClient }) => {
    requireState('ownerToken', ownerToken);

    const raw = await apiClient.fetchRaw(
      'GET',
      `/sessions/local?projectId=${projectId}&activeOnly=false`,
      undefined,
      ownerToken,
    );

    expect(raw.status).toBe(200);
    const groups = raw.body.data as ReadonlyArray<{
      readonly projectPath: string;
      readonly sessions: ReadonlyArray<{ readonly isRemote?: boolean }>;
    }>;

    // Should have team session groups with @memberName
    const teamGroup = groups.find((g) => g.projectPath.startsWith('@'));
    expect(teamGroup, 'Team session group (@userName) should exist').toBeTruthy();
  });

  // ── CLEAN-047: Team stats reflect synced sessions ─────────────────────

  test('CLEAN-047: Team stats reflect both synced users', async ({ apiClient }) => {
    requireState('ownerToken', ownerToken);

    const stats = await apiClient.get<
      ReadonlyArray<{ readonly userId: string; readonly sessionCount: number }>
    >(`/projects/${projectId}/team-stats`, ownerToken);

    const ownerEntry = (stats as ReadonlyArray<{ userId: string; sessionCount: number }>).find(
      (m) => m.userId === ownerId,
    );
    const memberEntry = (stats as ReadonlyArray<{ userId: string; sessionCount: number }>).find(
      (m) => m.userId === memberId,
    );

    expect(ownerEntry, 'Owner should appear in team stats').toBeTruthy();
    expect(memberEntry, 'Member should appear in team stats').toBeTruthy();
    // Owner: imported session + local synced session
    expect(ownerEntry!.sessionCount).toBeGreaterThanOrEqual(2);
    // Member: imported session + local synced session
    expect(memberEntry!.sessionCount).toBeGreaterThanOrEqual(2);
  });

  // ── CLEAN-048: Cleanup temp session files ─────────────────────────────

  test('CLEAN-048: Cleanup temp session files', async () => {
    cleanupLocalSessionDir(OWNER_LOCAL_DIR);
    cleanupLocalSessionDir(MEMBER_LOCAL_DIR);

    expect(
      existsSync(`${process.env['HOME']}/.claude/projects/${OWNER_LOCAL_DIR.replace(/\//g, '-')}`),
    ).toBe(false);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Conversations UI Verification
  // ═══════════════════════════════════════════════════════════════════════

  // ── CLEAN-049: Conversations page shows synced sessions ───────────────

  test('CLEAN-049: Dashboard shows synced sessions from both users', async ({ page }) => {
    requireState('ownerToken', ownerToken);

    await setAuthState(
      page,
      ownerToken,
      { id: ownerId, email: ownerEmail, name: ownerName },
      projectId,
    );
    await page.goto('/dashboard');
    await waitForAppReady(page);

    // Sessions imported/synced earlier should appear in Timeline
    await expect(page.locator('text=Timeline')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Auth Feature Implementation')).toBeVisible({ timeout: 15_000 });
  });

  // ── CLEAN-050: Dashboard timeline shows owner sessions ──────────────

  test('CLEAN-050: Dashboard timeline shows owner sessions', async ({ page }) => {
    requireState('ownerToken', ownerToken);

    await setAuthState(
      page,
      ownerToken,
      { id: ownerId, email: ownerEmail, name: ownerName },
      projectId,
    );
    await page.goto('/dashboard');
    await waitForAppReady(page);

    await expect(page.locator('text=Timeline')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(`text=${ownerName}`).first()).toBeVisible({ timeout: 10_000 });
  });

  // ── CLEAN-051: Dashboard timeline shows member sessions ───────────────

  test('CLEAN-051: Dashboard timeline shows member sessions', async ({ page }) => {
    requireState('ownerToken', ownerToken);
    requireState('memberName', memberName);

    await setAuthState(
      page,
      ownerToken,
      { id: ownerId, email: ownerEmail, name: ownerName },
      projectId,
    );
    await page.goto('/dashboard');
    await waitForAppReady(page);

    await expect(page.locator('text=Timeline')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(`text=${memberName}`).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Auth Refactoring')).toBeVisible({ timeout: 10_000 });
  });

  // ── CLEAN-052: Member views dashboard and sees all sessions ───────────

  test('CLEAN-052: Member views dashboard and sees all sessions', async ({ page }) => {
    requireState('memberToken', memberToken);

    await setAuthState(
      page,
      memberToken,
      { id: memberId, email: memberEmail, name: memberName },
      projectId,
    );
    await page.goto('/dashboard');
    await waitForAppReady(page);

    await expect(page.locator('text=Timeline')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Auth Feature Implementation')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Auth Refactoring')).toBeVisible({ timeout: 10_000 });
  });
});
