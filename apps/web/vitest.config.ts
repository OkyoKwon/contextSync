import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['__tests__/**/*.test.{ts,tsx}', 'src/**/__tests__/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      // TODO: 테스트 추가 후 점진적으로 임계값 상향 (목표 80%)
      thresholds: {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
  },
});
