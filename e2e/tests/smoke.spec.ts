import { test, expect } from '../fixtures/auth.fixture.js';
import { sql } from 'kysely';
import { buildUser } from '../helpers/test-data.js';

test.describe('Smoke Tests', () => {
  test('API health check returns ok', async () => {
    const response = await fetch('http://localhost:3099/api/health');
    const data = (await response.json()) as { status: string };
    expect(response.ok).toBe(true);
    expect(data.status).toBe('ok');
  });

  test('Login API returns token and user', async ({ apiClient }) => {
    const { name, email } = buildUser();
    const result = await apiClient.login(name, email);

    expect(result.token).toBeTruthy();
    expect(result.user.id).toBeTruthy();
    expect(result.user.email).toBe(email);
    expect(result.user.name).toBe(name);
  });

  test('Authenticated page can access dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForURL((url) => !url.pathname.includes('/login'));

    const url = authenticatedPage.url();
    expect(url).not.toContain('/login');
  });

  // Skip DB reset test in parallel mode as it truncates all tables and
  // interferes with other tests. This functionality is tested by using
  // the global-setup truncation which runs before all tests.
  test('DB connection works', async ({ db }) => {
    const result = await sql<{ count: string }>`SELECT count(*) FROM users`.execute(db);
    expect(Number(result.rows[0]?.count)).toBeGreaterThanOrEqual(0);
  });
});
