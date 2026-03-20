import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE conflicts ADD COLUMN reviewer_id UUID REFERENCES users(id)`.execute(db);
  await sql`ALTER TABLE conflicts ADD COLUMN review_notes TEXT`.execute(db);
  await sql`ALTER TABLE conflicts ADD COLUMN assigned_at TIMESTAMPTZ`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE conflicts DROP COLUMN IF EXISTS reviewer_id`.execute(db);
  await sql`ALTER TABLE conflicts DROP COLUMN IF EXISTS review_notes`.execute(db);
  await sql`ALTER TABLE conflicts DROP COLUMN IF EXISTS assigned_at`.execute(db);
}
