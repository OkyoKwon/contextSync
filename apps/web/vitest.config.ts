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
    setupFiles: ['./src/test/setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}', 'src/**/__tests__/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      // Phase 4a 완료 + MSW 테스트 전환 완료 (2026-03-25)
      // 목표 80% — Phase 4b-d (레이아웃/기능/페이지 컴포넌트)에서 달성 예정
      thresholds: {
        branches: 78,
        functions: 65,
        lines: 12,
        statements: 12,
      },
    },
  },
});
