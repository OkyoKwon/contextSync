import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('ai_evaluations')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('project_id', 'uuid', (col) => col.notNull())
    .addColumn('target_user_id', 'uuid', (col) => col.notNull().references('users.id'))
    .addColumn('triggered_by_user_id', 'uuid', (col) => col.notNull().references('users.id'))
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('pending'))
    .addColumn('overall_score', 'real')
    .addColumn('prompt_quality_score', 'real')
    .addColumn('task_complexity_score', 'real')
    .addColumn('iteration_pattern_score', 'real')
    .addColumn('context_utilization_score', 'real')
    .addColumn('ai_capability_leverage_score', 'real')
    .addColumn('proficiency_tier', 'text')
    .addColumn('sessions_analyzed', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('messages_analyzed', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('date_range_start', 'timestamptz', (col) => col.notNull())
    .addColumn('date_range_end', 'timestamptz', (col) => col.notNull())
    .addColumn('model_used', 'text', (col) => col.notNull())
    .addColumn('input_tokens_used', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('output_tokens_used', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('error_message', 'text')
    .addColumn('improvement_summary', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('completed_at', 'timestamptz')
    .execute();

  await db.schema
    .createTable('ai_evaluation_dimensions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('evaluation_id', 'uuid', (col) =>
      col.notNull().references('ai_evaluations.id').onDelete('cascade'),
    )
    .addColumn('dimension', 'text', (col) => col.notNull())
    .addColumn('score', 'real', (col) => col.notNull())
    .addColumn('confidence', 'real', (col) => col.notNull())
    .addColumn('summary', 'text', (col) => col.notNull())
    .addColumn('strengths', sql`text[]`, (col) => col.notNull().defaultTo(sql`'{}'::text[]`))
    .addColumn('weaknesses', sql`text[]`, (col) => col.notNull().defaultTo(sql`'{}'::text[]`))
    .addColumn('suggestions', sql`text[]`, (col) => col.notNull().defaultTo(sql`'{}'::text[]`))
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();

  await db.schema
    .createTable('ai_evaluation_evidence')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('dimension_id', 'uuid', (col) =>
      col.notNull().references('ai_evaluation_dimensions.id').onDelete('cascade'),
    )
    .addColumn('message_id', 'uuid')
    .addColumn('session_id', 'uuid')
    .addColumn('excerpt', 'text', (col) => col.notNull())
    .addColumn('sentiment', 'text', (col) => col.notNull().defaultTo('neutral'))
    .addColumn('annotation', 'text', (col) => col.notNull())
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('ai_evaluation_evidence').execute();
  await db.schema.dropTable('ai_evaluation_dimensions').execute();
  await db.schema.dropTable('ai_evaluations').execute();
}
