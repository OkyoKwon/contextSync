import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/__tests__/**',
        'src/index.ts',
        'src/database/migrations/**',
        'src/database/seed.ts',
        'src/database/seed-marketing/**',
        'src/database/types.ts',
        'src/scripts/**',
        'src/app.ts',
        'src/config/database.ts',
        'src/database/migrate.ts',
        'src/test-helpers/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
