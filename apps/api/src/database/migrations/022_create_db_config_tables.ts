import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('project_db_configs')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('project_id', 'uuid', (col) =>
      col.notNull().unique().references('projects.id').onDelete('cascade'),
    )
    .addColumn('provider', 'text', (col) => col.notNull().defaultTo('self-hosted'))
    .addColumn('connection_url', 'text', (col) => col.notNull())
    .addColumn('ssl_enabled', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('pending'))
    .addColumn('schema_version', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('migrated_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('data_migration_jobs')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('project_id', 'uuid', (col) =>
      col.notNull().references('projects.id').onDelete('cascade'),
    )
    .addColumn('direction', 'text', (col) => col.notNull().defaultTo('to_remote'))
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('pending'))
    .addColumn('total_sessions', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('migrated_sessions', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('total_messages', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('migrated_messages', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('error_message', 'text')
    .addColumn('started_at', 'timestamptz')
    .addColumn('completed_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_migration_jobs_project_id')
    .on('data_migration_jobs')
    .column('project_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('data_migration_jobs').execute();
  await db.schema.dropTable('project_db_configs').execute();
}
