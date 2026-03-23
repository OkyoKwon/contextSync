import { test, expect } from '../fixtures/auth.fixture.js';
import { sql } from 'kysely';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const EXPECTED_MIGRATION_COUNT = 27;
const LAST_MIGRATION_NAME = '027_add_project_database_mode';

const EXPECTED_TABLES = [
  'users',
  'projects',
  'project_collaborators',
  'sessions',
  'messages',
  'conflicts',
  'prompt_templates',
  'synced_sessions',
  'prd_documents',
  'prd_analyses',
  'prd_requirements',
  'activity_log',
  'ai_evaluations',
  'ai_evaluation_dimensions',
  'ai_evaluation_evidence',
] as const;

test.describe('Setup Verification', () => {
  test('All migrations are applied', async ({ db }) => {
    const result = await sql<{ name: string }>`
      SELECT name FROM kysely_migration ORDER BY name ASC
    `.execute(db);

    expect(result.rows).toHaveLength(EXPECTED_MIGRATION_COUNT);

    const lastMigration = result.rows[result.rows.length - 1];
    expect(lastMigration?.name).toBe(LAST_MIGRATION_NAME);
  });

  test('Database has all expected application tables', async ({ db }) => {
    const result = await sql<{ table_name: string }>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `.execute(db);

    const tableNames = result.rows.map((r) => r.table_name);

    for (const expected of EXPECTED_TABLES) {
      expect(tableNames, `Missing table: ${expected}`).toContain(expected);
    }
  });

  test('.env.example covers all env.ts schema variables', () => {
    const envExamplePath = resolve('apps/api/.env.example');
    const envTsPath = resolve('apps/api/src/config/env.ts');

    const envExampleContent = readFileSync(envExamplePath, 'utf-8');
    const envTsContent = readFileSync(envTsPath, 'utf-8');

    const schemaKeyRegex = /^\s+(\w+):\s*z\./gm;
    const schemaKeys: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = schemaKeyRegex.exec(envTsContent)) !== null) {
      schemaKeys.push(match[1]!);
    }

    expect(schemaKeys.length).toBeGreaterThan(0);

    for (const key of schemaKeys) {
      const keyPattern = new RegExp(`(^|#\\s*)${key}(=|\\b)`, 'm');
      expect(
        keyPattern.test(envExampleContent),
        `env.ts key "${key}" not found in .env.example`,
      ).toBe(true);
    }
  });

  test('Web frontend responds with HTML', async () => {
    const response = await fetch('http://localhost:5199/');

    expect(response.ok).toBe(true);

    const contentType = response.headers.get('content-type') ?? '';
    expect(contentType).toContain('text/html');
  });

  test('docker-compose.yml defines postgres service with healthcheck', () => {
    const composePath = resolve('docker-compose.yml');
    const content = readFileSync(composePath, 'utf-8');

    expect(content).toContain('postgres:');
    expect(content).toContain('postgres:16-alpine');
    expect(content).toContain('healthcheck:');
    expect(content).toContain('pg_isready');
  });

  test('Auth system works end-to-end after setup', async ({ apiClient }) => {
    const timestamp = Date.now();
    const name = `setup-test-${timestamp}`;
    const email = `setup-test-${timestamp}@test.com`;

    const loginResult = await apiClient.login(name, email);
    expect(loginResult.token).toBeTruthy();
    expect(loginResult.user.id).toBeTruthy();

    const project = await apiClient.createProject(loginResult.token, {
      name: `Setup Verify Project ${timestamp}`,
    });
    expect(project.id).toBeTruthy();
    expect(project.name).toContain('Setup Verify Project');
  });

  test('Full-text search vectors are configured', async ({ db }) => {
    const sessionsResult = await sql<{ column_name: string }>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'sessions'
        AND column_name = 'search_vector'
    `.execute(db);
    expect(sessionsResult.rows).toHaveLength(1);

    const messagesResult = await sql<{ column_name: string }>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'messages'
        AND column_name = 'search_vector'
    `.execute(db);
    expect(messagesResult.rows).toHaveLength(1);
  });
});
