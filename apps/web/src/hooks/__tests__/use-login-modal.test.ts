import { describe, it, expect, beforeEach, vi } from 'vitest';

let useLoginModal: typeof import('../use-login-modal').useLoginModal;

describe('useLoginModal', () => {
  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../use-login-modal');
    useLoginModal = mod.useLoginModal;
  });

  it('starts with isOpen false', () => {
    expect(useLoginModal.getState().isOpen).toBe(false);
  });

  it('openLoginModal sets isOpen to true', () => {
    useLoginModal.getState().openLoginModal();
    expect(useLoginModal.getState().isOpen).toBe(true);
  });

  it('closeLoginModal sets isOpen to false', () => {
    useLoginModal.getState().openLoginModal();
    useLoginModal.getState().closeLoginModal();
    expect(useLoginModal.getState().isOpen).toBe(false);
  });
});
