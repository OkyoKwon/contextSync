import { readFileSync } from 'node:fs';
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { Database } from './types.js';

export interface DbOptions {
  readonly connectionString: string;
  readonly ssl?: boolean;
  readonly sslCaPath?: string;
}

export function createDb(options: DbOptions): Kysely<Database> {
  const sslConfig = options.ssl
    ? {
        rejectUnauthorized: !!options.sslCaPath,
        ...(options.sslCaPath ? { ca: readFileSync(options.sslCaPath, 'utf-8') } : {}),
      }
    : false;

  const dialect = new PostgresDialect({
    pool: new pg.Pool({
      connectionString: options.connectionString,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: sslConfig,
    }),
  });

  return new Kysely<Database>({ dialect });
}

export type Db = Kysely<Database>;
