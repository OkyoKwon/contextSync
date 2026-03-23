/**
 * Playwright-based screenshot capture script for marketing materials.
 *
 * Usage:
 *   1. Ensure dev servers are running: pnpm dev
 *   2. Seed marketing data: pnpm --filter @context-sync/api seed:marketing
 *   3. Run: npx playwright test scripts/capture-screenshots.ts --config=scripts/playwright-capture.config.ts
 *
 * Or use the shortcut:
 *   pnpm capture-screenshots
 */

import { test } from '@playwright/test';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

const API_BASE = 'http://localhost:3001/api';
const WEB_BASE = 'http://localhost:5173';
const OUTPUT_DIR = join(import.meta.dirname, '..', 'imageAsset', 'screenshots');
const OPTIONAL_DIR = join(import.meta.dirname, '..', 'imageAsset', 'optional');

// Ensure output dirs exist
mkdirSync(OUTPUT_DIR, { recursive: true });
mkdirSync(OPTIONAL_DIR, { recursive: true });

// ── helpers ──────────────────────────────────────────────

interface LoginResult {
  readonly token: string;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly name: string;
  };
}

interface Project {
  readonly id: string;
  readonly name: string;
}

interface Session {
  readonly id: string;
  readonly title: string;
}

async function apiLogin(name: string, email: string): Promise<LoginResult> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });
  const json = (await res.json()) as { success: boolean; data: LoginResult };
  if (!json.success) throw new Error(`Login failed for ${email}`);
  return json.data;
}

async function getProjects(token: string): Promise<readonly Project[]> {
  const res = await fetch(`${API_BASE}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as { success: boolean; data: readonly Project[] };
  return json.data;
}

async function getSessions(token: string, projectId: string): Promise<readonly Session[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/sessions?limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as { success: boolean; data: readonly Session[] };
  return json.data;
}

async function linkDirectory(token: string, projectId: string, directory: string): Promise<void> {
  await fetch(`${API_BASE}/projects/${projectId}/my-directory`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ localDirectory: directory }),
  });
}

// ── screenshot suite ─────────────────────────────────────

test.describe('Marketing Screenshots', () => {
  let loginResult: LoginResult;
  let projectId: string;
  let sessions: readonly Session[];

  test.beforeAll(async () => {
    // Login as Alex (Owner)
    loginResult = await apiLogin('Alex Kim', 'alex@contextsync.io');
    const projects = await getProjects(loginResult.token);
    const csProject = projects.find((p) => p.name === 'ContextSync');
    if (!csProject) throw new Error('ContextSync project not found — run seed:marketing first');
    projectId = csProject.id;

    // Link a directory so the Project page shows sessions instead of directory prompt
    await linkDirectory(loginResult.token, projectId, '~/Desktop/Projects/contextSync');

    // Fetch sessions for direct navigation
    sessions = await getSessions(loginResult.token, projectId);
  });

  /** Inject auth state into page before navigation */
  async function authenticate(page: import('@playwright/test').Page) {
    const storageValue = JSON.stringify({
      state: {
        token: loginResult.token,
        user: {
          id: loginResult.user.id,
          email: loginResult.user.email,
          name: loginResult.user.name,
        },
        currentProjectId: projectId,
      },
      version: 0,
    });

    await page.addInitScript((value) => {
      window.localStorage.setItem('context-sync-auth', value);
    }, storageValue);
  }

  // ── 01. Dashboard Full ──────────────────────────────────

  test('01 — Dashboard Full', async ({ page }) => {
    await authenticate(page);
    await page.goto(`${WEB_BASE}/dashboard`);
    await page.waitForSelector('[data-testid="dashboard-stats"], .grid', { timeout: 15_000 });
    // Wait for charts/data to render
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: join(OUTPUT_DIR, 'dashboard-full.png'),
      fullPage: false,
    });
  });

  // ── 02. Dashboard Stats (cropped) ───────────────────────

  test('02 — Dashboard Stats', async ({ page }) => {
    await authenticate(page);
    await page.goto(`${WEB_BASE}/dashboard`);
    await page.waitForSelector('[data-testid="dashboard-stats"], .grid', { timeout: 15_000 });
    await page.waitForTimeout(2000);

    // Try to crop just the stats cards area at the top
    const statsArea = page.locator('[data-testid="dashboard-stats"]').first();
    if (await statsArea.isVisible()) {
      await statsArea.screenshot({
        path: join(OUTPUT_DIR, 'dashboard-stats.png'),
      });
    } else {
      // Fallback: crop top portion
      await page.screenshot({
        path: join(OUTPUT_DIR, 'dashboard-stats.png'),
        clip: { x: 0, y: 0, width: 1440, height: 400 },
      });
    }
  });

  // ── 03. Token Usage Chart (cropped) ─────────────────────

  test('03 — Token Usage Chart', async ({ page }) => {
    await authenticate(page);
    await page.goto(`${WEB_BASE}/dashboard`);
    await page.waitForTimeout(3000);

    // Clip the token usage section (chart + model breakdown table)
    // Sidebar is ~115px, content starts below the stats cards (~250px from top)
    await page.screenshot({
      path: join(OUTPUT_DIR, 'token-usage-chart.png'),
      clip: { x: 115, y: 240, width: 1325, height: 420 },
    });
  });

  // ── 04. Session Conversation ────────────────────────────

  test('04 — Session Conversation', async ({ page }) => {
    await authenticate(page);

    // Navigate to a session with rich messages to show the conversation thread
    // Sessions are ordered by most recent first — pick the JWT Auth session or fallback to first
    const jwtSession = sessions.find((s) => s.title.includes('JWT'));
    const sessionId = jwtSession?.id ?? sessions[0]?.id;
    if (sessionId) {
      await page.goto(`${WEB_BASE}/project/sessions/${sessionId}`);
    } else {
      await page.goto(`${WEB_BASE}/project`);
    }
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: join(OUTPUT_DIR, 'session-conversation.png'),
      fullPage: false,
    });
  });

  // ── 05. Session Detail ──────────────────────────────────

  test('05 — Session Detail', async ({ page }) => {
    await authenticate(page);

    // Navigate to a different session from the conversation screenshot (PRD or conflict detection)
    const prdSession = sessions.find((s) => s.title.includes('PRD'));
    const conflictSession = sessions.find((s) => s.title.includes('conflict'));
    const sessionId = prdSession?.id ?? conflictSession?.id ?? sessions[1]?.id;
    if (sessionId) {
      await page.goto(`${WEB_BASE}/project/sessions/${sessionId}`);
    } else {
      await page.goto(`${WEB_BASE}/project`);
    }
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: join(OUTPUT_DIR, 'session-detail.png'),
      fullPage: false,
    });
  });

  // ── 06. Conflicts List ──────────────────────────────────

  test('06 — Conflicts List', async ({ page }) => {
    await authenticate(page);
    await page.goto(`${WEB_BASE}/conflicts`);
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: join(OUTPUT_DIR, 'conflicts-list.png'),
      fullPage: false,
    });
  });

  // ── 07. Conflict Detail (full-page with all conflicts visible) ──

  test('07 — Conflict Detail', async ({ page }) => {
    await authenticate(page);
    await page.goto(`${WEB_BASE}/conflicts`);
    await page.waitForTimeout(3000);

    // Capture full page to show all 4 conflicts with their details
    await page.screenshot({
      path: join(OUTPUT_DIR, 'conflict-detail.png'),
      fullPage: true,
    });
  });

  // ── 08. PRD Analysis ────────────────────────────────────

  test('08 — PRD Analysis', async ({ page }) => {
    await authenticate(page);
    await page.goto(`${WEB_BASE}/prd-analysis`);
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: join(OUTPUT_DIR, 'prd-analysis.png'),
      fullPage: false,
    });
  });

  // ── 09. PRD Trend Chart (cropped) ───────────────────────

  test('09 — PRD Trend Chart', async ({ page }) => {
    await authenticate(page);
    await page.goto(`${WEB_BASE}/prd-analysis`);
    await page.waitForTimeout(3000);

    // Target the trend chart SVG by its specific viewBox
    const chart = page.locator('svg[viewBox="0 0 600 220"]').first();
    if (await chart.isVisible()) {
      // Capture the parent container for better framing
      const parent = chart.locator('..');
      await parent.screenshot({
        path: join(OUTPUT_DIR, 'prd-trend-chart.png'),
      });
    } else {
      // Fallback: scroll to chart area and capture
      await page.evaluate(() => window.scrollTo(0, 300));
      await page.waitForTimeout(500);
      await page.screenshot({
        path: join(OUTPUT_DIR, 'prd-trend-chart.png'),
        fullPage: false,
      });
    }
  });

  // ── 10. Search Overlay ──────────────────────────────────

  test('10 — Search Overlay', async ({ page }) => {
    await authenticate(page);
    await page.goto(`${WEB_BASE}/dashboard`);
    await page.waitForTimeout(2000);

    // Trigger search with Cmd+K
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);

    // Type a search query
    const searchInput = page
      .locator('input[type="search"], input[placeholder*="earch"], input[placeholder*="검색"]')
      .first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('authentication');
      await page.waitForTimeout(2000); // Wait for results
    }

    await page.screenshot({
      path: join(OUTPUT_DIR, 'search-overlay.png'),
      fullPage: false,
    });
  });

  // ── 11. Settings (Team) ─────────────────────────────────

  test('11 — Settings Team', async ({ page }) => {
    await authenticate(page);
    await page.goto(`${WEB_BASE}/settings`);
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: join(OUTPUT_DIR, 'settings-team.png'),
      fullPage: false,
    });
  });

  // ── 12. AI Evaluation ───────────────────────────────────

  test('12 — AI Evaluation', async ({ page }) => {
    await authenticate(page);
    await page.goto(`${WEB_BASE}/ai-evaluation`);
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: join(OUTPUT_DIR, 'ai-evaluation.png'),
      fullPage: false,
    });
  });

  // ── Optional: Admin Panel ───────────────────────────────

  test('13 — Admin Panel (optional)', async ({ page }) => {
    await authenticate(page);
    await page.goto(`${WEB_BASE}/admin`);
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: join(OPTIONAL_DIR, 'admin-panel.png'),
      fullPage: false,
    });
  });

  // ── Optional: Plans View ────────────────────────────────

  test('14 — Plans View (optional)', async ({ page }) => {
    await authenticate(page);
    await page.goto(`${WEB_BASE}/plans`);
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: join(OPTIONAL_DIR, 'plans-view.png'),
      fullPage: false,
    });
  });
});
