import { api } from './client';

export interface DatabaseStatus {
  readonly databaseMode: 'local' | 'remote';
  readonly provider: 'local' | 'supabase' | 'custom';
  readonly host: string;
  readonly remoteUrl: string | null;
}

export interface ConnectionTestResult {
  readonly success: boolean;
  readonly latencyMs: number;
  readonly version: string | null;
  readonly error: string | null;
}

export interface SwitchToRemoteResult {
  readonly requiresRestart: boolean;
  readonly migrationsApplied: readonly string[];
}

export const setupApi = {
  getStatus: () => api.get<DatabaseStatus>('/setup/status'),

  testConnection: (connectionUrl: string, sslEnabled: boolean) =>
    api.post<ConnectionTestResult>('/setup/test-connection', { connectionUrl, sslEnabled }),

  switchToRemote: (connectionUrl: string, sslEnabled: boolean, projectId: string) =>
    api.post<SwitchToRemoteResult>('/setup/switch-to-remote', {
      connectionUrl,
      sslEnabled,
      projectId,
    }),
};
