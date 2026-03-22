import { promises as fs } from 'fs';
import path from 'path';
import { Migrator, FileMigrationProvider, sql } from 'kysely';
import type { Db } from '../../database/client.js';
import type { Env } from '../../config/env.js';
import type {
  AdminStatus,
  AdminConfig,
  MigrationRunResult,
  DatabaseHealth,
  MigrationInfo,
  SslStatus,
  ConnectionPoolStats,
} from '@context-sync/shared';
import { ForbiddenError } from '../../plugins/error-handler.plugin.js';

export function assertAdmin(userRole: string): void {
  if (userRole !== 'owner' && userRole !== 'admin') {
    throw new ForbiddenError('Admin access requires owner or admin role');
  }
}

export function assertOwnerRole(userRole: string): void {
  if (userRole !== 'owner') {
    throw new ForbiddenError('This action requires owner role');
  }
}

export async function getAdminStatus(db: Db): Promise<AdminStatus> {
  const [database, migrations, sslStatus] = await Promise.all([
    getDatabaseHealth(db),
    getMigrationList(db),
    getSslStatus(db),
  ]);

  return { database, migrations, ssl: sslStatus };
}

async function getDatabaseHealth(db: Db): Promise<DatabaseHealth> {
  const start = performance.now();
  const versionResult = await sql<{ version: string }>`SELECT version()`.execute(db);
  const latencyMs = Math.round(performance.now() - start);

  const poolResult = await sql<ConnectionPoolStats>`
    SELECT
      count(*) FILTER (WHERE state = 'active')::int AS active,
      count(*) FILTER (WHERE state = 'idle')::int AS idle,
      (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max
    FROM pg_stat_activity
    WHERE datname = current_database()
  `.execute(db);

  const pool = poolResult.rows[0] ?? { active: 0, idle: 0, max: 0 };
  const fullVersion = versionResult.rows[0]?.version ?? 'unknown';
  const version = fullVersion.split(',')[0] ?? fullVersion;

  return { connected: true, latencyMs, version, pool };
}

async function getMigrationList(db: Db): Promise<readonly MigrationInfo[]> {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(import.meta.dirname, '../../database/migrations'),
    }),
  });

  const allMigrations = await migrator.getMigrations();

  return allMigrations.map((m) => ({
    name: m.name,
    executedAt: m.executedAt ? m.executedAt.toISOString() : null,
  }));
}

async function getSslStatus(db: Db): Promise<SslStatus> {
  try {
    const result = await sql<{ ssl: boolean; count: number }>`
      SELECT ssl, count(*)::int AS count
      FROM pg_stat_ssl
      JOIN pg_stat_activity ON pg_stat_ssl.pid = pg_stat_activity.pid
      WHERE datname = current_database()
      GROUP BY ssl
    `.execute(db);

    let sslConnections = 0;
    let nonSslConnections = 0;
    for (const row of result.rows) {
      if (row.ssl) {
        sslConnections = row.count;
      } else {
        nonSslConnections = row.count;
      }
    }

    return {
      enabled: sslConnections > 0,
      sslConnections,
      nonSslConnections,
    };
  } catch {
    return { enabled: false, sslConnections: 0, nonSslConnections: 0 };
  }
}

export async function runMigrations(db: Db): Promise<MigrationRunResult> {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(import.meta.dirname, '../../database/migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  const applied: string[] = [];
  const errors: string[] = [];

  for (const result of results ?? []) {
    if (result.status === 'Success') {
      applied.push(result.migrationName);
    } else if (result.status === 'Error') {
      errors.push(result.migrationName);
    }
  }

  if (error) {
    errors.push(String(error));
  }

  return { applied, errors };
}

export function getAdminConfig(env: Env): AdminConfig {
  const connectionString = maskConnectionString(env.DATABASE_URL);

  return {
    sslEnabled: env.DATABASE_SSL,
    connectionString,
  };
}

function maskConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch {
    return '****';
  }
}
