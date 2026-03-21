import type { AdminStatus, AdminConfig, MigrationRunResult } from '@context-sync/shared';
import { api } from './client';

export const adminApi = {
  getStatus: () => api.get<AdminStatus>('/admin/status'),
  runMigrations: () => api.post<MigrationRunResult>('/admin/migrations/run'),
  getConfig: () => api.get<AdminConfig>('/admin/config'),
};
