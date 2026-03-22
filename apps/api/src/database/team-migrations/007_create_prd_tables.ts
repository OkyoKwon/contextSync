import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('prd_documents')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('project_id', 'uuid', (col) => col.notNull())
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id'))
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('file_name', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('prd_analyses')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('prd_document_id', 'uuid', (col) =>
      col.notNull().references('prd_documents.id').onDelete('cascade'),
    )
    .addColumn('project_id', 'uuid', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('pending'))
    .addColumn('overall_rate', 'real')
    .addColumn('total_items', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('achieved_items', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('partial_items', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('not_started_items', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('scanned_files_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('model_used', 'text', (col) => col.notNull())
    .addColumn('input_tokens_used', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('output_tokens_used', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('error_message', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('completed_at', 'timestamptz')
    .execute();

  await db.schema
    .createTable('prd_requirements')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('prd_analysis_id', 'uuid', (col) =>
      col.notNull().references('prd_analyses.id').onDelete('cascade'),
    )
    .addColumn('requirement_text', 'text', (col) => col.notNull())
    .addColumn('category', 'text')
    .addColumn('status', 'text', (col) => col.notNull())
    .addColumn('confidence', 'real', (col) => col.notNull())
    .addColumn('evidence', 'text')
    .addColumn('file_paths', sql`text[]`, (col) => col.notNull().defaultTo(sql`'{}'::text[]`))
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('prd_requirements').execute();
  await db.schema.dropTable('prd_analyses').execute();
  await db.schema.dropTable('prd_documents').execute();
}
