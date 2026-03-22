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
      // Phase 4a 완료: stores + hooks + API + UI 컴포넌트 테스트 (2026-03-22)
      // 목표 80% — Phase 4b-d (레이아웃/기능/페이지 컴포넌트)에서 달성 예정
      thresholds: {
        branches: 74,
        functions: 54,
        lines: 11,
        statements: 11,
      },
    },
  },
});
