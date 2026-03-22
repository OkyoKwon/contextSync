import { describe, it, expect, beforeEach, vi } from 'vitest';

let useThemeStore: typeof import('../theme.store').useThemeStore;

describe('useThemeStore', () => {
  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../theme.store');
    useThemeStore = mod.useThemeStore;
  });

  it('has dark as initial theme', () => {
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('toggleTheme switches to light', () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('toggleTheme twice returns to dark', () => {
    useThemeStore.getState().toggleTheme();
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});
