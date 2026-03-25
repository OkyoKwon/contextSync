import { test, expect } from '../../fixtures/auth.fixture.js';
import { buildUser, buildProject } from '../../helpers/test-data.js';
import { waitForAppReady } from '../../helpers/wait-for.js';
import {
  toProfileName,
  allocatePorts,
  buildEnvContent,
} from '../../../apps/api/src/scripts/setup-team.js';

test.describe('Team Onboarding — Profile Flow', () => {
  let ownerToken: string;
  let ownerName: string;
  let ownerId: string;
  let memberToken: string;
  let memberName: string;
  let memberId: string;
  let projectId: string;
  let projectName: string;
  let joinCode: string;

  // ── CLEAN-023: Owner creates project and generates join code ──────────

  test('CLEAN-023: Owner creates project and generates join code', async ({ apiClient }) => {
    const ownerData = buildUser({ name: 'Onboard Owner' });
    const login = await apiClient.identify(ownerData.name);
    ownerToken = login.token;
    ownerName = login.user.name;
    ownerId = login.user.id;

    const projData = buildProject();
    projectName = projData.name;
    const project = await apiClient.createProject(ownerToken, projData);
    projectId = project.id;

    const generated = await apiClient.post<{ id: string; joinCode: string }>(
      `/projects/${projectId}/join-code`,
      {},
      ownerToken,
    );
    joinCode = generated.joinCode ?? '';

    expect(joinCode).toBeTruthy();
    expect(joinCode.length).toBeGreaterThanOrEqual(6);
  });

  // ── CLEAN-024: Member joins via API join code ─────────────────────────

  test('CLEAN-024: Member joins project via join code API', async ({ apiClient }) => {
    const memberData = buildUser({ name: 'Onboard Member' });
    const login = await apiClient.identify(memberData.name);
    memberToken = login.token;
    memberName = login.user.name;
    memberId = login.user.id;

    const result = await apiClient.post<{ id: string }>(
      '/projects/join',
      { code: joinCode },
      memberToken,
    );

    expect(result.id).toBe(projectId);

    // Verify via projects list
    const projects = await apiClient.get<ReadonlyArray<{ id: string }>>('/projects', memberToken);
    const joined = (projects as ReadonlyArray<{ id: string }>).find((p) => p.id === projectId);
    expect(joined).toBeTruthy();
  });

  // ── CLEAN-025: Profile name derived from project name ─────────────────

  test('CLEAN-025: Profile name derived from project name', () => {
    expect(toProfileName('Acme Team')).toBe('acme-team');
    expect(toProfileName('My Project 2024')).toBe('my-project-2024');
    expect(toProfileName('  Hello World  ')).toBe('hello-world');
    expect(toProfileName('UPPERCASE')).toBe('uppercase');
    expect(toProfileName('special!@#chars')).toBe('special-chars');
    expect(toProfileName('a')).toBe('a');
    expect(toProfileName('---leading-trailing---')).toBe('leading-trailing');

    // The actual project name from CLEAN-023 should also convert cleanly
    const derived = toProfileName(projectName);
    expect(derived).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]?$/);
    expect(derived.length).toBeLessThanOrEqual(30);
  });

  // ── CLEAN-026: Port allocation avoids conflicts ───────────────────────

  test('CLEAN-026: Port allocation avoids conflicts', () => {
    const ports = allocatePorts();

    // Ports should be numbers above default range
    expect(ports.apiPort).toBeGreaterThanOrEqual(3101);
    expect(ports.webPort).toBeGreaterThanOrEqual(5273);

    // API and Web ports should not collide
    expect(ports.apiPort).not.toBe(ports.webPort);

    // Should not use default ports
    expect(ports.apiPort).not.toBe(3001);
    expect(ports.webPort).not.toBe(5173);
  });

  // ── CLEAN-027: Profile env file contains correct values ───────────────

  test('CLEAN-027: Profile env content has correct structure', () => {
    const content = buildEnvContent({
      dbUrl: 'postgresql://user:pass@host:5432/db',
      ssl: true,
      jwtSecret: 'test-secret-abc123',
      apiPort: 3101,
      webPort: 5273,
    });

    expect(content).toContain('PORT=3101');
    expect(content).toContain('VITE_PORT=5273');
    expect(content).toContain('DATABASE_URL=postgresql://user:pass@host:5432/db');
    expect(content).toContain('DATABASE_SSL=true');
    expect(content).toContain('JWT_SECRET=test-secret-abc123');
    expect(content).toContain('FRONTEND_URL=http://localhost:5273');
    expect(content).toContain('RUN_MIGRATIONS=true');
    expect(content).toContain('HOST=0.0.0.0');
  });

  // ── CLEAN-028: Member sees joined project in dashboard ────────────────

  test('CLEAN-028: Member sees joined project in dashboard', async ({ page }) => {
    await page.addInitScript(
      (value) => window.localStorage.setItem('context-sync-auth', value),
      JSON.stringify({
        state: {
          token: memberToken,
          user: { id: memberId, email: `member@e2e.test`, name: memberName },
          currentProjectId: projectId,
        },
        version: 0,
      }),
    );

    await page.goto('/dashboard');
    await waitForAppReady(page);

    // Project name should appear somewhere on the page (sidebar or header)
    await expect(page.locator(`text=${projectName}`).first()).toBeVisible({ timeout: 10_000 });
  });
});
