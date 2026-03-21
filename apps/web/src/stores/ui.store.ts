import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  readonly sidebarCollapsed: boolean;
  readonly toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    { name: 'context-sync-ui' },
  ),
);
