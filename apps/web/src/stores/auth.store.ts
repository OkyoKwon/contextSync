import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@context-sync/shared';

interface AuthState {
  readonly token: string | null;
  readonly user: User | null;
  readonly currentProjectId: string | null;
  setAuth: (token: string, user: User) => void;
  setCurrentProject: (projectId: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      currentProjectId: null,
      setAuth: (token, user) => set({ token, user }),
      setCurrentProject: (projectId) => set({ currentProjectId: projectId }),
      logout: () => set({ token: null, user: null, currentProjectId: null }),
    }),
    { name: 'context-sync-auth' },
  ),
);
