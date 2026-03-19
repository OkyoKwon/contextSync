import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE synced_sessions (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      session_id          UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      external_session_id VARCHAR(255) NOT NULL,
      source_path         VARCHAR(1024) NOT NULL,
      synced_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(project_id, external_session_id)
    )
  `.execute(db);

  await sql`CREATE INDEX idx_synced_sessions_project ON synced_sessions(project_id)`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_synced_sessions_project`.execute(db);
  await sql`DROP TABLE IF EXISTS synced_sessions`.execute(db);
}
