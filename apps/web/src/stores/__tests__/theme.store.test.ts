import { describe, it, expect, beforeEach, vi } from 'vitest';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((_i: number) => null),
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

let useThemeStore: typeof import('../theme.store').useThemeStore;

describe('useThemeStore', () => {
  beforeEach(async () => {
    localStorageMock.clear();
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
