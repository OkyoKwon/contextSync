import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/quickstart',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // webServer 없음 — test-quickstart.sh가 이미 서버를 실행 중
});
