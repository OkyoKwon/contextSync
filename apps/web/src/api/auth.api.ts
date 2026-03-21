import type { User } from '@context-sync/shared';
import { api } from './client';

export const authApi = {
  getMe: () => api.get<User>('/auth/me'),

  login: (name: string, email: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { name, email }),

  refresh: () => api.post<{ token: string }>('/auth/refresh'),
};
