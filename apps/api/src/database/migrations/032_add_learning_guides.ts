import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE ai_evaluation_learning_guides (
      id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      evaluation_group_id     VARCHAR(255) NOT NULL,
      target_user_id          VARCHAR(255) NOT NULL,
      status                  VARCHAR(20) NOT NULL DEFAULT 'pending',
      current_tier_summary    TEXT,
      current_tier_summary_ko TEXT,
      next_tier_goal          TEXT,
      next_tier_goal_ko       TEXT,
      priority_areas          TEXT[] NOT NULL DEFAULT '{}',
      model_used              VARCHAR(100) NOT NULL DEFAULT '',
      input_tokens_used       INTEGER NOT NULL DEFAULT 0,
      output_tokens_used      INTEGER NOT NULL DEFAULT 0,
      error_message           TEXT,
      created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at            TIMESTAMPTZ
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_learning_guides_group
      ON ai_evaluation_learning_guides(evaluation_group_id)
  `.execute(db);

  await sql`
    CREATE INDEX idx_learning_guides_user
      ON ai_evaluation_learning_guides(target_user_id, created_at DESC)
  `.execute(db);

  await sql`
    CREATE TABLE ai_evaluation_learning_steps (
      id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      learning_guide_id  UUID NOT NULL REFERENCES ai_evaluation_learning_guides(id) ON DELETE CASCADE,
      step_number        INTEGER NOT NULL,
      title              TEXT NOT NULL,
      title_ko           TEXT,
      objective          TEXT NOT NULL,
      objective_ko       TEXT,
      target_dimensions  TEXT[] NOT NULL DEFAULT '{}',
      key_actions        TEXT[] NOT NULL DEFAULT '{}',
      key_actions_ko     TEXT[],
      practice_prompt    TEXT,
      practice_prompt_ko TEXT,
      sort_order         INTEGER NOT NULL DEFAULT 0,
      UNIQUE(learning_guide_id, step_number)
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_learning_steps_guide
      ON ai_evaluation_learning_steps(learning_guide_id)
  `.execute(db);

  await sql`
    CREATE TABLE ai_evaluation_learning_resources (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      learning_step_id  UUID NOT NULL REFERENCES ai_evaluation_learning_steps(id) ON DELETE CASCADE,
      title             TEXT NOT NULL,
      title_ko          TEXT,
      url               TEXT NOT NULL,
      type              VARCHAR(20) NOT NULL,
      level             VARCHAR(20) NOT NULL,
      description       TEXT NOT NULL,
      description_ko    TEXT,
      estimated_minutes INTEGER,
      sort_order        INTEGER NOT NULL DEFAULT 0
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_learning_resources_step
      ON ai_evaluation_learning_resources(learning_step_id)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS ai_evaluation_learning_resources`.execute(db);
  await sql`DROP TABLE IF EXISTS ai_evaluation_learning_steps`.execute(db);
  await sql`DROP TABLE IF EXISTS ai_evaluation_learning_guides`.execute(db);
}
