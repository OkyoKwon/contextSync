import type { Db } from '../../database/client.js';

export interface DbConfigRow {
  readonly id: string;
  readonly projectId: string;
  readonly provider: string;
  readonly connectionUrl: string;
  readonly sslEnabled: boolean;
  readonly status: string;
  readonly schemaVersion: number;
  readonly migratedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface MigrationJobRow {
  readonly id: string;
  readonly projectId: string;
  readonly direction: string;
  readonly status: string;
  readonly totalSessions: number;
  readonly migratedSessions: number;
  readonly totalMessages: number;
  readonly migratedMessages: number;
  readonly errorMessage: string | null;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly createdAt: Date;
}

function toDbConfig(row: Record<string, unknown>): DbConfigRow {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    provider: row.provider as string,
    connectionUrl: row.connection_url as string,
    sslEnabled: row.ssl_enabled as boolean,
    status: row.status as string,
    schemaVersion: row.schema_version as number,
    migratedAt: row.migrated_at as Date | null,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

function toMigrationJob(row: Record<string, unknown>): MigrationJobRow {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    direction: row.direction as string,
    status: row.status as string,
    totalSessions: row.total_sessions as number,
    migratedSessions: row.migrated_sessions as number,
    totalMessages: row.total_messages as number,
    migratedMessages: row.migrated_messages as number,
    errorMessage: row.error_message as string | null,
    startedAt: row.started_at as Date | null,
    completedAt: row.completed_at as Date | null,
    createdAt: row.created_at as Date,
  };
}

export async function findByProjectId(db: Db, projectId: string): Promise<DbConfigRow | null> {
  const row = await db
    .selectFrom('project_db_configs')
    .selectAll()
    .where('project_id', '=', projectId)
    .executeTakeFirst();
  return row ? toDbConfig(row) : null;
}

export async function createConfig(
  db: Db,
  projectId: string,
  connectionUrl: string,
  provider: string,
  sslEnabled: boolean,
): Promise<DbConfigRow> {
  const row = await db
    .insertInto('project_db_configs')
    .values({
      project_id: projectId,
      connection_url: connectionUrl,
      provider,
      ssl_enabled: sslEnabled,
      status: 'pending',
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  return toDbConfig(row);
}

export async function updateStatus(
  db: Db,
  projectId: string,
  status: string,
  schemaVersion?: number,
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date(),
  };
  if (schemaVersion !== undefined) {
    updates.schema_version = schemaVersion;
  }
  if (status === 'active') {
    updates.migrated_at = new Date();
  }

  await db
    .updateTable('project_db_configs')
    .set(updates)
    .where('project_id', '=', projectId)
    .execute();
}

export async function deleteConfig(db: Db, projectId: string): Promise<void> {
  await db.deleteFrom('project_db_configs').where('project_id', '=', projectId).execute();
}

export async function createMigrationJob(
  db: Db,
  projectId: string,
  direction: 'to_remote' | 'to_local',
  totalSessions: number,
  totalMessages: number,
): Promise<MigrationJobRow> {
  const row = await db
    .insertInto('data_migration_jobs')
    .values({
      project_id: projectId,
      direction,
      status: 'running',
      total_sessions: totalSessions,
      total_messages: totalMessages,
      started_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  return toMigrationJob(row);
}

export async function updateMigrationJob(
  db: Db,
  jobId: string,
  updates: {
    readonly status?: string;
    readonly migratedSessions?: number;
    readonly migratedMessages?: number;
    readonly errorMessage?: string | null;
    readonly completedAt?: Date;
  },
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.migratedSessions !== undefined)
    dbUpdates.migrated_sessions = updates.migratedSessions;
  if (updates.migratedMessages !== undefined)
    dbUpdates.migrated_messages = updates.migratedMessages;
  if (updates.errorMessage !== undefined) dbUpdates.error_message = updates.errorMessage;
  if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

  await db.updateTable('data_migration_jobs').set(dbUpdates).where('id', '=', jobId).execute();
}

export async function findLatestMigrationJob(
  db: Db,
  projectId: string,
): Promise<MigrationJobRow | null> {
  const row = await db
    .selectFrom('data_migration_jobs')
    .selectAll()
    .where('project_id', '=', projectId)
    .orderBy('created_at', 'desc')
    .limit(1)
    .executeTakeFirst();
  return row ? toMigrationJob(row) : null;
}
