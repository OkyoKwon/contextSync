import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env['CI'];

const TEST_DB_URL = 'postgresql://postgres:postgres@localhost:5433/contextsync_clean';
const TEST_API_PORT = 3098;
const TEST_WEB_PORT = 5198;

process.env['TEST_DATABASE_URL'] = TEST_DB_URL;
process.env['TEST_API_BASE'] = `http://localhost:${TEST_API_PORT}/api`;

export default defineConfig({
  testDir: './tests/clean-env',
  globalSetup: './clean-env-setup.ts',
  globalTeardown: './clean-env-teardown.ts',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
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
      command: `DATABASE_URL=${TEST_DB_URL} PORT=${TEST_API_PORT} NODE_ENV=test RUN_MIGRATIONS=true pnpm --filter @context-sync/api dev`,
      url: `http://localhost:${TEST_API_PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `VITE_API_TARGET=http://localhost:${TEST_API_PORT} VITE_PORT=${TEST_WEB_PORT} pnpm --filter @context-sync/web dev`,
      url: `http://localhost:${TEST_WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
