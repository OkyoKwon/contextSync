import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env['CI'];

const TEST_DB_URL = 'postgresql://postgres:postgres@localhost:5432/contextsync_test';
const TEST_API_PORT = 3099;
const TEST_WEB_PORT = 5199;

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/clean-env/**'],
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? 'github' : 'html',
  use: {
    baseURL: `http://localhost:${TEST_WEB_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `node -e "
        const pg = require('pg');
        const c = new pg.Client('postgresql://postgres:postgres@localhost:5432/postgres');
        c.connect().then(() =>
          c.query(\\"SELECT 1 FROM pg_database WHERE datname='contextsync_test'\\").then(r => {
            if (r.rows.length === 0) return c.query('CREATE DATABASE contextsync_test');
          })
        ).then(() => c.end()).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
      " && DATABASE_URL=${TEST_DB_URL} DATABASE_SSL=false PORT=${TEST_API_PORT} NODE_ENV=test pnpm --filter @context-sync/api dev`,
      url: `http://localhost:${TEST_API_PORT}/api/health`,
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
    {
      command: `VITE_API_TARGET=http://localhost:${TEST_API_PORT} VITE_PORT=${TEST_WEB_PORT} pnpm --filter @context-sync/web dev`,
      url: `http://localhost:${TEST_WEB_PORT}`,
      reuseExistingServer: !isCI,
      timeout: 30_000,
    },
  ],
});
