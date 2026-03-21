import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE ai_evaluations (
      id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id                    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      target_user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      triggered_by_user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status                        VARCHAR(50) NOT NULL DEFAULT 'pending',
      overall_score                 NUMERIC(5,2),
      prompt_quality_score          NUMERIC(5,2),
      task_complexity_score         NUMERIC(5,2),
      iteration_pattern_score       NUMERIC(5,2),
      context_utilization_score     NUMERIC(5,2),
      ai_capability_leverage_score  NUMERIC(5,2),
      proficiency_tier              VARCHAR(50),
      sessions_analyzed             INTEGER NOT NULL DEFAULT 0,
      messages_analyzed             INTEGER NOT NULL DEFAULT 0,
      date_range_start              TIMESTAMPTZ NOT NULL,
      date_range_end                TIMESTAMPTZ NOT NULL,
      model_used                    VARCHAR(100) NOT NULL,
      input_tokens_used             INTEGER NOT NULL DEFAULT 0,
      output_tokens_used            INTEGER NOT NULL DEFAULT 0,
      error_message                 TEXT,
      improvement_summary           TEXT,
      created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at                  TIMESTAMPTZ
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_ai_evaluations_project_user_created
      ON ai_evaluations(project_id, target_user_id, created_at DESC)
  `.execute(db);

  await sql`
    CREATE INDEX idx_ai_evaluations_project_id
      ON ai_evaluations(project_id)
  `.execute(db);

  await sql`
    CREATE TABLE ai_evaluation_dimensions (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      evaluation_id   UUID NOT NULL REFERENCES ai_evaluations(id) ON DELETE CASCADE,
      dimension       VARCHAR(100) NOT NULL,
      score           NUMERIC(5,2) NOT NULL,
      confidence      NUMERIC(5,2) NOT NULL,
      summary         TEXT NOT NULL,
      strengths       TEXT[] NOT NULL DEFAULT '{}',
      weaknesses      TEXT[] NOT NULL DEFAULT '{}',
      suggestions     TEXT[] NOT NULL DEFAULT '{}',
      sort_order      INTEGER NOT NULL DEFAULT 0
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_ai_eval_dimensions_evaluation_id
      ON ai_evaluation_dimensions(evaluation_id)
  `.execute(db);

  await sql`
    CREATE TABLE ai_evaluation_evidence (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      dimension_id    UUID NOT NULL REFERENCES ai_evaluation_dimensions(id) ON DELETE CASCADE,
      message_id      UUID REFERENCES messages(id) ON DELETE SET NULL,
      session_id      UUID REFERENCES sessions(id) ON DELETE SET NULL,
      excerpt         TEXT NOT NULL,
      sentiment       VARCHAR(20) NOT NULL DEFAULT 'neutral',
      annotation      TEXT NOT NULL,
      sort_order      INTEGER NOT NULL DEFAULT 0
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_ai_eval_evidence_dimension_id
      ON ai_evaluation_evidence(dimension_id)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS ai_evaluation_evidence`.execute(db);
  await sql`DROP TABLE IF EXISTS ai_evaluation_dimensions`.execute(db);
  await sql`DROP TABLE IF EXISTS ai_evaluations`.execute(db);
}
