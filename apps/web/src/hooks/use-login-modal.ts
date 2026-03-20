import { create } from 'zustand';

interface LoginModalState {
  readonly isOpen: boolean;
  readonly openLoginModal: () => void;
  readonly closeLoginModal: () => void;
}

export const useLoginModal = create<LoginModalState>((set) => ({
  isOpen: false,
  openLoginModal: () => set({ isOpen: true }),
  closeLoginModal: () => set({ isOpen: false }),
}));
