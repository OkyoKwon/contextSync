import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('prompt_templates')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('project_id', 'uuid', (col) => col.references('projects.id').onDelete('set null'))
    .addColumn('author_id', 'uuid', (col) => col.notNull().references('users.id'))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('variables', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'`))
    .addColumn('category', 'varchar(100)')
    .addColumn('tags', sql`TEXT[]`, (col) => col.notNull().defaultTo(sql`'{}'`))
    .addColumn('usage_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('version', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('prompt_templates').execute();
}
