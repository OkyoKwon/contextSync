import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { testConnection, type ConnectionTestResult } from '../../lib/test-connection.js';

export { testConnection, type ConnectionTestResult };

export interface DatabaseStatus {
  readonly databaseMode: 'local' | 'remote';
  readonly provider: 'local' | 'supabase' | 'custom';
  readonly host: string;
}

// Tracks whether switchToRemote has been called successfully in this process.
// Once set, getDatabaseStatus returns 'remote' regardless of hostname heuristics.
let switchedToRemoteHost: string | null = null;

export function getDatabaseStatus(databaseUrl: string): DatabaseStatus {
  const effectiveUrl = switchedToRemoteHost ?? databaseUrl;
  const url = new URL(effectiveUrl);
  const hostname = url.hostname;
  const isRemote =
    switchedToRemoteHost !== null || !['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);
  const isSupabase = hostname.includes('supabase.com') || hostname.includes('supabase.co');

  const maskedHost = isRemote ? `*.${hostname.split('.').slice(-2).join('.')}` : 'localhost';

  return {
    databaseMode: isRemote ? 'remote' : 'local',
    provider: isSupabase ? 'supabase' : isRemote ? 'custom' : 'local',
    host: maskedHost,
  };
}

export interface SwitchToRemoteResult {
  readonly requiresRestart: boolean;
  readonly migrationsApplied: readonly string[];
}

export async function switchToRemote(
  connectionUrl: string,
  sslEnabled: boolean,
): Promise<SwitchToRemoteResult> {
  // 1. Test connection
  const testResult = await testConnection(connectionUrl, sslEnabled);
  if (!testResult.success) {
    throw new Error(`Connection test failed: ${testResult.error}`);
  }

  // 2. Run full migrations on the remote DB
  // We create a temporary Kysely instance for migration
  const { Kysely, PostgresDialect } = await import('kysely');
  const pg = await import('pg');
  const { promises: fs } = await import('node:fs');

  const remoteDb = new Kysely({
    dialect: new PostgresDialect({
      pool: new pg.default.Pool({
        connectionString: connectionUrl,
        ssl: sslEnabled ? { rejectUnauthorized: true } : false,
      }),
    }),
  });

  try {
    const { Migrator, FileMigrationProvider } = await import('kysely');

    const migrator = new Migrator({
      db: remoteDb,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder: path.join(import.meta.dirname, '../../database/migrations'),
      }),
    });

    const { error, results } = await migrator.migrateToLatest();

    const applied: string[] = [];
    for (const result of results ?? []) {
      if (result.status === 'Success') {
        applied.push(result.migrationName);
      }
    }

    if (error) {
      throw new Error(`Migration failed on remote database: ${String(error)}`);
    }

    // 3. Update in-memory state (immediate effect) and persist to .env
    switchedToRemoteHost = connectionUrl;
    if (process.env['NODE_ENV'] !== 'test') {
      updateEnvFile(connectionUrl, sslEnabled);
    }

    return { requiresRestart: false, migrationsApplied: applied };
  } finally {
    await remoteDb.destroy();
  }
}

function updateEnvFile(connectionUrl: string, sslEnabled: boolean): void {
  const envPath = path.join(import.meta.dirname, '../../../.env');
  let content: string;
  try {
    content = readFileSync(envPath, 'utf-8');
  } catch {
    content = '';
  }

  let updated = replaceEnvVar(content, 'DATABASE_URL', connectionUrl);
  updated = replaceEnvVar(updated, 'DATABASE_SSL', String(sslEnabled));

  // Skip write if content is unchanged (avoids triggering file watchers)
  if (updated !== content) {
    writeFileSync(envPath, updated, 'utf-8');
  }
}

function replaceEnvVar(content: string, key: string, value: string): string {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  if (regex.test(content)) {
    return content.replace(regex, line);
  }
  return content.trimEnd() + '\n' + line + '\n';
}
