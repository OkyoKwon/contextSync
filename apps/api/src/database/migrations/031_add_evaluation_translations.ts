import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE ai_evaluations
      ADD COLUMN improvement_summary_ko TEXT
  `.execute(db);

  await sql`
    ALTER TABLE ai_evaluation_dimensions
      ADD COLUMN summary_ko TEXT,
      ADD COLUMN strengths_ko TEXT[],
      ADD COLUMN weaknesses_ko TEXT[],
      ADD COLUMN suggestions_ko TEXT[]
  `.execute(db);

  await sql`
    ALTER TABLE ai_evaluation_evidence
      ADD COLUMN annotation_ko TEXT
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE ai_evaluations
      DROP COLUMN IF EXISTS improvement_summary_ko
  `.execute(db);

  await sql`
    ALTER TABLE ai_evaluation_dimensions
      DROP COLUMN IF EXISTS summary_ko,
      DROP COLUMN IF EXISTS strengths_ko,
      DROP COLUMN IF EXISTS weaknesses_ko,
      DROP COLUMN IF EXISTS suggestions_ko
  `.execute(db);

  await sql`
    ALTER TABLE ai_evaluation_evidence
      DROP COLUMN IF EXISTS annotation_ko
  `.execute(db);
}
