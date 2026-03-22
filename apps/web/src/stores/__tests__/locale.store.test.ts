import { describe, it, expect, beforeEach, vi } from 'vitest';

let useLocaleStore: typeof import('../locale.store').useLocaleStore;

describe('useLocaleStore', () => {
  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../locale.store');
    useLocaleStore = mod.useLocaleStore;
  });

  it('has "en" as default locale', () => {
    expect(useLocaleStore.getState().locale).toBe('en');
  });

  it('setLocale changes locale to ko', () => {
    useLocaleStore.getState().setLocale('ko');
    expect(useLocaleStore.getState().locale).toBe('ko');
  });

  it('setLocale changes locale to ja', () => {
    useLocaleStore.getState().setLocale('ja');
    expect(useLocaleStore.getState().locale).toBe('ja');
  });

  it('persists locale to localStorage', () => {
    useLocaleStore.getState().setLocale('ko');
    const stored = localStorage.getItem('context-sync-locale');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.state.locale).toBe('ko');
  });
});
