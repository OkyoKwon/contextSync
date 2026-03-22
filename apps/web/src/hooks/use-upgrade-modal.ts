import { create } from 'zustand';

interface UpgradeModalState {
  readonly isOpen: boolean;
  readonly onSuccess: (() => void) | null;
  readonly openUpgradeModal: (onSuccess?: () => void) => void;
  readonly closeUpgradeModal: () => void;
}

export const useUpgradeModal = create<UpgradeModalState>((set) => ({
  isOpen: false,
  onSuccess: null,
  openUpgradeModal: (onSuccess) => set({ isOpen: true, onSuccess: onSuccess ?? null }),
  closeUpgradeModal: () => set({ isOpen: false, onSuccess: null }),
}));
