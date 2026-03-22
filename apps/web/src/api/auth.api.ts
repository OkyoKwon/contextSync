import type { User, ClaudePlan } from '@context-sync/shared';
import { api } from './client';

export const authApi = {
  getMe: () => api.get<User>('/auth/me'),

  login: (name: string, email: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { name, email }),

  autoLogin: () => api.post<{ token: string; user: User }>('/auth/auto'),

  upgrade: (name: string, email: string, autoUserId: string) =>
    api.post<{ token: string; user: User }>('/auth/upgrade', { name, email, autoUserId }),

  refresh: () => api.post<{ token: string }>('/auth/refresh'),

  updatePlan: (claudePlan: ClaudePlan) => api.put<User>('/auth/me/plan', { claudePlan }),

  updateApiKey: (apiKey: string) => api.put<User>('/auth/me/api-key', { apiKey }),

  deleteApiKey: () => api.delete<User>('/auth/me/api-key'),
};
