import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('sessions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('project_id', 'uuid', (col) => col.notNull().references('projects.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('title', 'varchar(500)', (col) => col.notNull())
    .addColumn('source', 'varchar(20)', (col) => col.notNull().defaultTo('manual'))
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('completed'))
    .addColumn('file_paths', sql`TEXT[]`, (col) => col.notNull().defaultTo(sql`'{}'`))
    .addColumn('module_names', sql`TEXT[]`, (col) => col.notNull().defaultTo(sql`'{}'`))
    .addColumn('branch', 'varchar(255)')
    .addColumn('tags', sql`TEXT[]`, (col) => col.notNull().defaultTo(sql`'{}'`))
    .addColumn('metadata', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'`))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema.createIndex('idx_sessions_project_id').on('sessions').column('project_id').execute();
  await db.schema.createIndex('idx_sessions_user_id').on('sessions').column('user_id').execute();
  await db.schema.createIndex('idx_sessions_created_at').on('sessions').column('created_at').execute();
  await sql`CREATE INDEX idx_sessions_file_paths ON sessions USING GIN(file_paths)`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('sessions').execute();
}
