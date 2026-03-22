export type DbProvider = 'self-hosted' | 'supabase';
export type DbConfigStatus = 'pending' | 'migrating' | 'active' | 'failed';
export type MigrationJobStatus = 'pending' | 'running' | 'completed' | 'failed';
export type MigrationDirection = 'to_remote' | 'to_local';

export interface DbConfig {
  readonly id: string;
  readonly projectId: string;
  readonly provider: DbProvider;
  readonly maskedUrl: string;
  readonly sslEnabled: boolean;
  readonly status: DbConfigStatus;
  readonly schemaVersion: number;
  readonly migratedAt: string | null;
  readonly createdAt: string;
}

export interface ConnectionTestResult {
  readonly success: boolean;
  readonly latencyMs: number;
  readonly version: string | null;
  readonly error: string | null;
}

export interface MigrationPreview {
  readonly sessions: number;
  readonly messages: number;
  readonly conflicts: number;
  readonly estimatedSeconds: number;
}

export interface MigrationProgress {
  readonly id: string;
  readonly status: MigrationJobStatus;
  readonly direction: MigrationDirection;
  readonly totalSessions: number;
  readonly migratedSessions: number;
  readonly totalMessages: number;
  readonly migratedMessages: number;
  readonly errorMessage: string | null;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
}

export interface SaveDbConfigInput {
  readonly connectionUrl: string;
  readonly provider: DbProvider;
  readonly sslEnabled: boolean;
}

export interface TestConnectionInput {
  readonly connectionUrl: string;
  readonly provider: DbProvider;
  readonly sslEnabled: boolean;
}
