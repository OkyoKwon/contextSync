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

let useUiStore: typeof import('../ui.store').useUiStore;

describe('useUiStore', () => {
  beforeEach(async () => {
    localStorageMock.clear();
    vi.resetModules();
    const mod = await import('../ui.store');
    useUiStore = mod.useUiStore;
  });

  it('has sidebarCollapsed as false initially', () => {
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });

  it('toggleSidebar sets to true', () => {
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
  });

  it('toggleSidebar twice returns to false', () => {
    useUiStore.getState().toggleSidebar();
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });
});
