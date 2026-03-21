import { promises as fs } from 'fs';
import { readFileSync } from 'node:fs';
import path from 'path';
import { Kysely, Migrator, FileMigrationProvider, PostgresDialect } from 'kysely';
import pg from 'pg';

async function main() {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  const deploymentMode = process.env['DEPLOYMENT_MODE'] ?? 'personal';
  if (deploymentMode === 'team-member') {
    console.warn(
      'WARNING: Migrations are skipped in team-member mode. ' +
        'The team host is responsible for running migrations.',
    );
    return;
  }

  const sslEnabled = process.env['DATABASE_SSL'] === 'true';
  const sslCaPath = process.env['DATABASE_SSL_CA'];
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
    console.error('Migration failed:', error);
    process.exit(1);
  }

  await db.destroy();
  console.log('All migrations completed');
}

main();
