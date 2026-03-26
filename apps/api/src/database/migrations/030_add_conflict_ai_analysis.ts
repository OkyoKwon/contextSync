import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE conflicts
      ADD COLUMN ai_verdict TEXT,
      ADD COLUMN ai_confidence INTEGER,
      ADD COLUMN ai_overlap_type TEXT,
      ADD COLUMN ai_summary TEXT,
      ADD COLUMN ai_risk_areas TEXT[],
      ADD COLUMN ai_recommendation TEXT,
      ADD COLUMN ai_recommendation_detail TEXT,
      ADD COLUMN ai_analyzed_at TIMESTAMPTZ,
      ADD COLUMN ai_model_used TEXT,
      ADD COLUMN ai_input_tokens INTEGER,
      ADD COLUMN ai_output_tokens INTEGER
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE conflicts
      DROP COLUMN IF EXISTS ai_verdict,
      DROP COLUMN IF EXISTS ai_confidence,
      DROP COLUMN IF EXISTS ai_overlap_type,
      DROP COLUMN IF EXISTS ai_summary,
      DROP COLUMN IF EXISTS ai_risk_areas,
      DROP COLUMN IF EXISTS ai_recommendation,
      DROP COLUMN IF EXISTS ai_recommendation_detail,
      DROP COLUMN IF EXISTS ai_analyzed_at,
      DROP COLUMN IF EXISTS ai_model_used,
      DROP COLUMN IF EXISTS ai_input_tokens,
      DROP COLUMN IF EXISTS ai_output_tokens
  `.execute(db);
}
