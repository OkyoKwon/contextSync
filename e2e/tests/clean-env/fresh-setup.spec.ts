import { test, expect } from '../../fixtures/auth.fixture.js';
import { buildUser, buildProject } from '../../helpers/test-data.js';
import { sql } from 'kysely';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const TEST_DB_URL =
  process.env['TEST_DATABASE_URL'] ??
  'postgresql://postgres:postgres@localhost:5433/contextsync_clean';

test.describe('Fresh Setup — Infrastructure Verification', () => {
  test('CLEAN-001: All 32 migrations apply to fresh database', async ({ db }) => {
    const result = await sql<{ name: string }>`
      SELECT name FROM kysely_migration ORDER BY name
    `.execute(db);

    expect(result.rows).toHaveLength(32);
    expect(result.rows[result.rows.length - 1]!.name).toBe('032_add_learning_guides');
  });

  test('CLEAN-002: All application tables are created', async ({ db }) => {
    const expectedTables = [
      'users',
      'projects',
      'project_collaborators',
      'sessions',
      'messages',
      'conflicts',
      'synced_sessions',
      'prd_documents',
      'prd_analyses',
      'prd_requirements',
      'activity_log',
      'ai_evaluations',
      'ai_evaluation_dimensions',
      'ai_evaluation_evidence',
      'prompt_templates',
    ];

    const result = await sql<{ table_name: string }>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `.execute(db);

    const tableNames = result.rows.map((r) => r.table_name);

    for (const table of expectedTables) {
      expect(tableNames, `Missing table: ${table}`).toContain(table);
    }
  });

  test('CLEAN-003: Search vector columns exist', async ({ db }) => {
    const result = await sql<{ table_name: string; column_name: string }>`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name = 'search_vector'
      ORDER BY table_name
    `.execute(db);

    const tableColumns = result.rows.map((r) => r.table_name);
    expect(tableColumns).toContain('sessions');
    expect(tableColumns).toContain('messages');
  });

  test('CLEAN-004: API health check responds', async ({ apiClient }) => {
    const result = await apiClient.fetchRaw('GET', '/health');
    expect(result.status).toBe(200);
  });

  test('CLEAN-005: Web frontend loads', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);
    expect(response!.headers()['content-type']).toContain('text/html');
  });

  test('CLEAN-006: Auth flow works on fresh database', async ({ apiClient }) => {
    const { name } = buildUser();
    const { token, user } = await apiClient.identify(name);

    expect(token).toBeTruthy();
    expect(user.id).toBeTruthy();

    const me = await apiClient.get<{ id: string }>('/auth/me', token);
    expect(me.id).toBe(user.id);
  });

  test('CLEAN-007: Full CRUD works after fresh setup', async ({ apiClient }) => {
    const { name } = buildUser();
    const { token } = await apiClient.identify(name);

    // Create project
    const project = await apiClient.createProject(token, buildProject());
    expect(project.id).toBeTruthy();

    // Import session
    const session = await apiClient.importSession(
      token,
      project.id,
      resolve(process.cwd(), 'e2e/fixtures/session-fixtures/sample-session.json'),
    );
    expect(session).toBeTruthy();

    // List sessions
    const sessions = await apiClient.get<{ id: string }[]>(
      `/projects/${project.id}/sessions`,
      token,
    );
    expect(sessions.length).toBeGreaterThan(0);

    // Delete project
    await apiClient.del(`/projects/${project.id}`, token);
    const result = await apiClient.fetchRaw('GET', `/projects/${project.id}`, undefined, token);
    expect(result.status).toBe(404);
  });

  test('CLEAN-008: Seed script runs without errors', async ({ db }) => {
    execSync(`DATABASE_URL=${TEST_DB_URL} pnpm --filter @context-sync/api seed`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    // Verify seed data exists in the database
    const users = await sql<{ count: string }>`SELECT count(*) FROM users`.execute(db);
    expect(Number(users.rows[0]!.count)).toBeGreaterThan(0);

    const projects = await sql<{ count: string }>`SELECT count(*) FROM projects`.execute(db);
    expect(Number(projects.rows[0]!.count)).toBeGreaterThan(0);
  });
});
