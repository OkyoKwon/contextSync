import { promises as fs } from 'fs';
import { readFileSync } from 'node:fs';
import path from 'path';
import { Kysely, Migrator, FileMigrationProvider, PostgresDialect } from 'kysely';
import pg from 'pg';

export interface MigrationOptions {
  readonly connectionString: string;
  readonly sslEnabled?: boolean;
  readonly sslCaPath?: string;
}

export async function runMigrations(options: MigrationOptions): Promise<void> {
  const { connectionString, sslEnabled = false, sslCaPath } = options;

  const sslConfig = sslEnabled
    ? {
        rejectUnauthorized: true,
        ...(sslCaPath ? { ca: readFileSync(sslCaPath, 'utf-8') } : {}),
      }
    : false;

  const db = new Kysely({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString, ssl: sslConfig }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(import.meta.dirname, 'migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`Migration "${it.migrationName}" executed successfully`);
    } else if (it.status === 'Error') {
      console.error(`Migration "${it.migrationName}" failed`);
    }
  });

  if (error) {
    await db.destroy();
    throw error;
  }

  await db.destroy();
  console.log('All migrations completed');
}

async function main() {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  try {
    await runMigrations({
      connectionString,
      sslEnabled: process.env['DATABASE_SSL'] === 'true',
      sslCaPath: process.env['DATABASE_SSL_CA'],
    });
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
