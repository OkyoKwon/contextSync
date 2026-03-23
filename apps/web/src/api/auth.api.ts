import type { User, ClaudePlan } from '@context-sync/shared';
import { api } from './client';

export const authApi = {
  getMe: () => api.get<User>('/auth/me'),

  login: (name: string, email: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { name, email }),

  identify: (name: string) =>
    api.post<{ token: string; user: User } | { users: User[]; needsSelection: true }>(
      '/auth/identify',
      { name },
    ),

  identifySelect: (userId: string) =>
    api.post<{ token: string; user: User }>('/auth/identify/select', { userId }),

  refresh: () => api.post<{ token: string }>('/auth/refresh'),

  updatePlan: (claudePlan: ClaudePlan) => api.put<User>('/auth/me/plan', { claudePlan }),

  updateApiKey: (apiKey: string) => api.put<User>('/auth/me/api-key', { apiKey }),

  deleteApiKey: () => api.delete<User>('/auth/me/api-key'),

  saveSupabaseToken: (token: string) => api.put<User>('/auth/me/supabase-token', { token }),

  deleteSupabaseToken: () => api.delete<User>('/auth/me/supabase-token'),
};
