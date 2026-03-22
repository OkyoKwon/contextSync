import { describe, it, expect, beforeEach, vi } from 'vitest';

let useUpgradeModal: typeof import('../use-upgrade-modal').useUpgradeModal;

describe('useUpgradeModal', () => {
  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../use-upgrade-modal');
    useUpgradeModal = mod.useUpgradeModal;
  });

  it('starts with isOpen false and onSuccess null', () => {
    const state = useUpgradeModal.getState();
    expect(state.isOpen).toBe(false);
    expect(state.onSuccess).toBeNull();
  });

  it('openUpgradeModal sets isOpen to true', () => {
    useUpgradeModal.getState().openUpgradeModal();
    expect(useUpgradeModal.getState().isOpen).toBe(true);
  });

  it('openUpgradeModal stores onSuccess callback', () => {
    const callback = vi.fn();
    useUpgradeModal.getState().openUpgradeModal(callback);
    expect(useUpgradeModal.getState().isOpen).toBe(true);
    expect(useUpgradeModal.getState().onSuccess).toBe(callback);
  });

  it('openUpgradeModal without callback sets onSuccess to null', () => {
    useUpgradeModal.getState().openUpgradeModal();
    expect(useUpgradeModal.getState().onSuccess).toBeNull();
  });

  it('closeUpgradeModal resets isOpen and onSuccess', () => {
    const callback = vi.fn();
    useUpgradeModal.getState().openUpgradeModal(callback);
    useUpgradeModal.getState().closeUpgradeModal();
    expect(useUpgradeModal.getState().isOpen).toBe(false);
    expect(useUpgradeModal.getState().onSuccess).toBeNull();
  });
});
