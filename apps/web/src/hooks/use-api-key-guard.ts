import { create } from 'zustand';

interface ApiKeyGuardState {
  readonly isOpen: boolean;
  readonly onSuccess: (() => void) | null;
  readonly openApiKeyGuard: (onSuccess?: () => void) => void;
  readonly closeApiKeyGuard: () => void;
}

export const useApiKeyGuard = create<ApiKeyGuardState>((set) => ({
  isOpen: false,
  onSuccess: null,
  openApiKeyGuard: (onSuccess) => set({ isOpen: true, onSuccess: onSuccess ?? null }),
  closeApiKeyGuard: () => set({ isOpen: false, onSuccess: null }),
}));
