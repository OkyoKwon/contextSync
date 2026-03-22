import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('conflicts')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('project_id', 'uuid', (col) => col.notNull())
    .addColumn('session_a_id', 'uuid', (col) => col.notNull().references('sessions.id'))
    .addColumn('session_b_id', 'uuid', (col) => col.notNull().references('sessions.id'))
    .addColumn('conflict_type', 'text', (col) => col.notNull())
    .addColumn('severity', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('open'))
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('overlapping_paths', sql`text[]`, (col) =>
      col.notNull().defaultTo(sql`'{}'::text[]`),
    )
    .addColumn('diff_data', 'text', (col) => col.notNull().defaultTo('{}'))
    .addColumn('resolved_by', 'uuid')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('resolved_at', 'timestamptz')
    .addColumn('reviewer_id', 'uuid')
    .addColumn('review_notes', 'text')
    .addColumn('assigned_at', 'timestamptz')
    .execute();

  await db.schema
    .createIndex('idx_conflicts_project_id')
    .on('conflicts')
    .column('project_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('conflicts').execute();
}
