import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('sessions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('project_id', 'uuid', (col) => col.notNull())
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id'))
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('source', 'text', (col) => col.notNull().defaultTo('manual'))
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
    .addColumn('file_paths', sql`text[]`, (col) => col.notNull().defaultTo(sql`'{}'::text[]`))
    .addColumn('module_names', sql`text[]`, (col) => col.notNull().defaultTo(sql`'{}'::text[]`))
    .addColumn('branch', 'text')
    .addColumn('tags', sql`text[]`, (col) => col.notNull().defaultTo(sql`'{}'::text[]`))
    .addColumn('metadata', 'text', (col) => col.notNull().defaultTo('{}'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_sessions_project_id')
    .on('sessions')
    .column('project_id')
    .execute();

  await db.schema.createIndex('idx_sessions_user_id').on('sessions').column('user_id').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('sessions').execute();
}
