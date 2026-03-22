import type {
  DbConfig,
  ConnectionTestResult,
  MigrationPreview,
  MigrationProgress,
  SaveDbConfigInput,
  TestConnectionInput,
} from '@context-sync/shared';
import { api } from './client';

export const dbConfigApi = {
  testConnection: (projectId: string, input: TestConnectionInput) =>
    api.post<ConnectionTestResult>(`/projects/${projectId}/db-config/test`, input),

  save: (projectId: string, input: SaveDbConfigInput) =>
    api.post<DbConfig>(`/projects/${projectId}/db-config`, input),

  get: (projectId: string) => api.get<DbConfig | null>(`/projects/${projectId}/db-config`),

  delete: (projectId: string) =>
    api.delete<{ deleted: boolean }>(`/projects/${projectId}/db-config`),

  getMigrationPreview: (projectId: string) =>
    api.get<MigrationPreview>(`/projects/${projectId}/db-config/migrate/preview`),

  startMigration: (projectId: string) =>
    api.post<MigrationProgress>(`/projects/${projectId}/db-config/migrate`),

  getMigrationProgress: (projectId: string) =>
    api.get<MigrationProgress | null>(`/projects/${projectId}/db-config/migrate`),
};
