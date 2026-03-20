import type { User } from '@context-sync/shared';
import { api } from './client';

export const authApi = {
  getMe: () => api.get<User>('/auth/me'),

  callback: (code: string) =>
    api.get<{ token: string; user: User }>(`/auth/github/callback?code=${code}`),

  refresh: () => api.post<{ token: string }>('/auth/refresh'),
};
