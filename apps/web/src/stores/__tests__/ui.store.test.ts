import { describe, it, expect, beforeEach, vi } from 'vitest';

let useUiStore: typeof import('../ui.store').useUiStore;

describe('useUiStore', () => {
  beforeEach(async () => {
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
