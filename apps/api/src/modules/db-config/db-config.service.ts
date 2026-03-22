import { Kysely, PostgresDialect, Migrator, FileMigrationProvider } from 'kysely';
import pg from 'pg';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Db } from '../../database/client.js';
import type { TeamDatabase } from '../../database/types.js';
import { encrypt, decrypt, maskConnectionUrl } from '../../lib/encryption.js';
import { ForbiddenError, AppError } from '../../plugins/error-handler.plugin.js';
import { assertPermission } from '../projects/permission.helper.js';
import * as dbConfigRepo from './db-config.repository.js';

export interface ConnectionTestResult {
  readonly success: boolean;
  readonly latencyMs: number;
  readonly version: string | null;
  readonly error: string | null;
}

export interface DbConfigResponse {
  readonly id: string;
  readonly projectId: string;
  readonly provider: string;
  readonly maskedUrl: string;
  readonly sslEnabled: boolean;
  readonly status: string;
  readonly schemaVersion: number;
  readonly migratedAt: string | null;
  readonly createdAt: string;
}

export interface MigrationPreview {
  readonly sessions: number;
  readonly messages: number;
  readonly conflicts: number;
  readonly estimatedSeconds: number;
}

export async function testConnection(
  connectionUrl: string,
  sslEnabled: boolean,
): Promise<ConnectionTestResult> {
  const pool = new pg.Pool({
    connectionString: connectionUrl,
    max: 1,
    connectionTimeoutMillis: 10_000,
    ssl: sslEnabled ? { rejectUnauthorized: true } : false,
  });

  const start = Date.now();
  try {
    const result = await pool.query('SELECT version()');
    const latencyMs = Date.now() - start;
    const version = result.rows[0]?.version ?? null;
    return { success: true, latencyMs, version, error: null };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, latencyMs, version: null, error: message };
  } finally {
    await pool.end().catch(() => {});
  }
}

export async function saveConfig(
  db: Db,
  projectId: string,
  userId: string,
  connectionUrl: string,
  provider: string,
  sslEnabled: boolean,
  jwtSecret: string,
): Promise<DbConfigResponse> {
  await assertOwner(db, projectId, userId);

  // Check if config already exists
  const existing = await dbConfigRepo.findByProjectId(db, projectId);
  if (existing) {
    throw new AppError('Remote DB config already exists for this project. Delete it first.', 409);
  }

  // Encrypt connection URL
  const encryptedUrl = encrypt(connectionUrl, jwtSecret);

  // Save config
  const config = await dbConfigRepo.createConfig(db, projectId, encryptedUrl, provider, sslEnabled);

  // Run team schema migrations on the remote DB
  try {
    await runTeamMigrations(connectionUrl, sslEnabled);
    await dbConfigRepo.updateStatus(db, projectId, 'migrating', 9);
  } catch (err) {
    await dbConfigRepo.deleteConfig(db, projectId);
    const message = err instanceof Error ? err.message : 'Schema migration failed';
    throw new AppError(`Failed to set up remote DB schema: ${message}`, 500);
  }

  return toDbConfigResponse({
    ...config,
    status: 'migrating',
    schemaVersion: 9,
    connectionUrl: maskConnectionUrl(connectionUrl),
  });
}

export async function getConfig(
  db: Db,
  projectId: string,
  userId: string,
  jwtSecret: string,
): Promise<DbConfigResponse | null> {
  await assertPermission(db, projectId, userId, 'data:read');

  const config = await dbConfigRepo.findByProjectId(db, projectId);
  if (!config) return null;

  const maskedUrl = maskConnectionUrl(decrypt(config.connectionUrl, jwtSecret));

  return toDbConfigResponse({ ...config, connectionUrl: maskedUrl });
}

export async function deleteConfig(db: Db, projectId: string, userId: string): Promise<void> {
  await assertOwner(db, projectId, userId);

  const config = await dbConfigRepo.findByProjectId(db, projectId);
  if (!config) {
    throw new AppError('No remote DB config found', 404);
  }

  await dbConfigRepo.deleteConfig(db, projectId);
}

export async function getMigrationPreview(
  db: Db,
  projectId: string,
  userId: string,
): Promise<MigrationPreview> {
  await assertOwner(db, projectId, userId);

  const [sessionCount, messageCount, conflictCount] = await Promise.all([
    db
      .selectFrom('sessions')
      .select(db.fn.countAll<number>().as('count'))
      .where('project_id', '=', projectId)
      .executeTakeFirstOrThrow()
      .then((r) => Number(r.count)),
    db
      .selectFrom('messages')
      .innerJoin('sessions', 'sessions.id', 'messages.session_id')
      .select(db.fn.countAll<number>().as('count'))
      .where('sessions.project_id', '=', projectId)
      .executeTakeFirstOrThrow()
      .then((r) => Number(r.count)),
    db
      .selectFrom('conflicts')
      .select(db.fn.countAll<number>().as('count'))
      .where('project_id', '=', projectId)
      .executeTakeFirstOrThrow()
      .then((r) => Number(r.count)),
  ]);

  // Rough estimate: 100 rows/sec
  const totalRows = sessionCount + messageCount + conflictCount;
  const estimatedSeconds = Math.max(1, Math.ceil(totalRows / 100));

  return {
    sessions: sessionCount,
    messages: messageCount,
    conflicts: conflictCount,
    estimatedSeconds,
  };
}

async function runTeamMigrations(connectionUrl: string, sslEnabled: boolean): Promise<void> {
  const teamDb = new Kysely<TeamDatabase>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({
        connectionString: connectionUrl,
        max: 2,
        connectionTimeoutMillis: 10_000,
        ssl: sslEnabled ? { rejectUnauthorized: true } : false,
      }),
    }),
  });

  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const migrationsDir = path.resolve(currentDir, '../../database/team-migrations');

    const migrator = new Migrator({
      db: teamDb,
      provider: new FileMigrationProvider({ fs, path, migrationFolder: migrationsDir }),
    });

    const { error } = await migrator.migrateToLatest();
    if (error) {
      throw error;
    }
  } finally {
    await teamDb.destroy();
  }
}

async function assertOwner(db: Db, projectId: string, userId: string): Promise<void> {
  const project = await db
    .selectFrom('projects')
    .select(['owner_id'])
    .where('id', '=', projectId)
    .executeTakeFirst();

  if (!project) {
    throw new AppError('Project not found', 404);
  }
  if (project.owner_id !== userId) {
    throw new ForbiddenError('Only the project owner can manage remote DB settings');
  }
}

function toDbConfigResponse(config: {
  readonly id: string;
  readonly projectId: string;
  readonly provider: string;
  readonly connectionUrl: string;
  readonly sslEnabled: boolean;
  readonly status: string;
  readonly schemaVersion: number;
  readonly migratedAt: Date | null;
  readonly createdAt: Date;
}): DbConfigResponse {
  return {
    id: config.id,
    projectId: config.projectId,
    provider: config.provider,
    maskedUrl: config.connectionUrl,
    sslEnabled: config.sslEnabled,
    status: config.status,
    schemaVersion: config.schemaVersion,
    migratedAt: config.migratedAt?.toISOString() ?? null,
    createdAt: config.createdAt.toISOString(),
  };
}
