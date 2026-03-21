export interface AdminStatus {
  readonly database: DatabaseHealth;
  readonly migrations: readonly MigrationInfo[];
  readonly ssl: SslStatus;
}

export interface DatabaseHealth {
  readonly connected: boolean;
  readonly latencyMs: number;
  readonly version: string;
  readonly pool: ConnectionPoolStats;
}

export interface ConnectionPoolStats {
  readonly active: number;
  readonly idle: number;
  readonly max: number;
}

export interface SslStatus {
  readonly enabled: boolean;
  readonly sslConnections: number;
  readonly nonSslConnections: number;
}

export interface MigrationInfo {
  readonly name: string;
  readonly executedAt: string | null;
}

export interface MigrationRunResult {
  readonly applied: readonly string[];
  readonly errors: readonly string[];
}

export type DatabaseProvider = 'self-hosted' | 'supabase';
export type DeploymentMode = 'personal' | 'team-host' | 'team-member';

export interface AdminConfig {
  readonly deploymentMode: DeploymentMode;
  readonly databaseProvider: DatabaseProvider;
  readonly sslEnabled: boolean;
  readonly connectionString: string;
  readonly supabaseDashboardUrl: string | null;
}
