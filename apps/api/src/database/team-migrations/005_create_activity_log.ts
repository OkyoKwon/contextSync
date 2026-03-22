import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('activity_log')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('project_id', 'uuid', (col) => col.notNull())
    .addColumn('user_id', 'uuid', (col) => col.notNull())
    .addColumn('action', 'text', (col) => col.notNull())
    .addColumn('entity_type', 'text', (col) => col.notNull())
    .addColumn('entity_id', 'text')
    .addColumn('metadata', 'text', (col) => col.notNull().defaultTo('{}'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_activity_log_project_id')
    .on('activity_log')
    .column('project_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('activity_log').execute();
}
