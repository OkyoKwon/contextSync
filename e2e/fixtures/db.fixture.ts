import { test as base } from '@playwright/test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import pg from 'pg';

const TEST_DB_URL = 'postgresql://postgres:postgres@localhost:5432/contextsync_test';

const APP_TABLES = [
  'ai_evaluation_evidence',
  'ai_evaluation_dimensions',
  'ai_evaluations',
  'activity_log',
  'prd_requirements',
  'prd_analyses',
  'prd_documents',
  'synced_sessions',
  'conflicts',
  'messages',
  'sessions',
  'prompt_templates',
  'project_collaborators',
  'projects',
  'users',
] as const;

export interface DbFixture {
  readonly db: Kysely<unknown>;
  readonly resetDb: () => Promise<void>;
}

export const test = base.extend<DbFixture>({
  db: async ({}, use) => {
    const db = new Kysely({
      dialect: new PostgresDialect({
        pool: new pg.Pool({ connectionString: TEST_DB_URL, max: 2 }),
      }),
    });

    await use(db);
    await db.destroy();
  },

  resetDb: async ({ db }, use) => {
    const reset = async () => {
      const tableList = APP_TABLES.join(', ');
      await sql.raw(`TRUNCATE ${tableList} CASCADE`).execute(db);
    };

    await use(reset);
  },
});
