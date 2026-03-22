import { api } from './client';

export interface DatabaseStatus {
  readonly databaseMode: 'local' | 'remote';
  readonly provider: 'local' | 'supabase' | 'custom';
  readonly host: string;
}

export const setupApi = {
  getStatus: () => api.get<DatabaseStatus>('/setup/status'),
};
