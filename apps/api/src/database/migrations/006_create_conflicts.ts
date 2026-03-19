import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('conflicts')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('project_id', 'uuid', (col) => col.notNull().references('projects.id').onDelete('cascade'))
    .addColumn('session_a_id', 'uuid', (col) => col.notNull().references('sessions.id').onDelete('cascade'))
    .addColumn('session_b_id', 'uuid', (col) => col.notNull().references('sessions.id').onDelete('cascade'))
    .addColumn('conflict_type', 'varchar(20)', (col) => col.notNull().defaultTo('file'))
    .addColumn('severity', 'varchar(20)', (col) => col.notNull().defaultTo('info'))
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('detected'))
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('overlapping_paths', sql`TEXT[]`, (col) => col.notNull().defaultTo(sql`'{}'`))
    .addColumn('diff_data', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'`))
    .addColumn('resolved_by', 'uuid', (col) => col.references('users.id'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('resolved_at', 'timestamptz')
    .addCheckConstraint('chk_different_sessions', sql`session_a_id <> session_b_id`)
    .execute();

  await db.schema.createIndex('idx_conflicts_project_id').on('conflicts').column('project_id').execute();
  await db.schema.createIndex('idx_conflicts_status').on('conflicts').column('status').execute();
  await db.schema.createIndex('idx_conflicts_severity').on('conflicts').column('severity').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('conflicts').execute();
}
