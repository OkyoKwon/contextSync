import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('synced_sessions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('project_id', 'uuid', (col) => col.notNull())
    .addColumn('session_id', 'uuid', (col) => col.notNull().references('sessions.id'))
    .addColumn('external_session_id', 'text', (col) => col.notNull())
    .addColumn('source_path', 'text', (col) => col.notNull())
    .addColumn('synced_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_synced_sessions_project_id')
    .on('synced_sessions')
    .column('project_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('synced_sessions').execute();
}
