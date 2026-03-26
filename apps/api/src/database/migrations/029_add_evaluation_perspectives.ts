import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE ai_evaluations
      ADD COLUMN perspective VARCHAR(20) NOT NULL DEFAULT 'claude',
      ADD COLUMN evaluation_group_id UUID
  `.execute(db);

  await sql`
    CREATE INDEX idx_ai_evaluations_group
      ON ai_evaluations(evaluation_group_id)
      WHERE evaluation_group_id IS NOT NULL
  `.execute(db);

  await sql`
    CREATE INDEX idx_ai_evaluations_perspective
      ON ai_evaluations(project_id, target_user_id, perspective, created_at DESC)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_ai_evaluations_perspective`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_ai_evaluations_group`.execute(db);
  await sql`
    ALTER TABLE ai_evaluations
      DROP COLUMN IF EXISTS evaluation_group_id,
      DROP COLUMN IF EXISTS perspective
  `.execute(db);
}
