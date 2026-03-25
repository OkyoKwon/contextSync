import { describe, it, expect, beforeEach, vi } from 'vitest';

let useApiKeyGuard: typeof import('../use-api-key-guard').useApiKeyGuard;

describe('useApiKeyGuard', () => {
  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../use-api-key-guard');
    useApiKeyGuard = mod.useApiKeyGuard;
  });

  it('starts with isOpen false and onSuccess null', () => {
    const state = useApiKeyGuard.getState();
    expect(state.isOpen).toBe(false);
    expect(state.onSuccess).toBeNull();
  });

  it('openApiKeyGuard sets isOpen to true', () => {
    useApiKeyGuard.getState().openApiKeyGuard();
    expect(useApiKeyGuard.getState().isOpen).toBe(true);
  });

  it('openApiKeyGuard stores onSuccess callback', () => {
    const cb = vi.fn();
    useApiKeyGuard.getState().openApiKeyGuard(cb);
    expect(useApiKeyGuard.getState().onSuccess).toBe(cb);
  });

  it('closeApiKeyGuard resets state', () => {
    useApiKeyGuard.getState().openApiKeyGuard(vi.fn());
    useApiKeyGuard.getState().closeApiKeyGuard();
    const state = useApiKeyGuard.getState();
    expect(state.isOpen).toBe(false);
    expect(state.onSuccess).toBeNull();
  });
});
