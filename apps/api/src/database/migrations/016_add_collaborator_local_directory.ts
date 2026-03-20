import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE project_collaborators ADD COLUMN local_directory VARCHAR(1024)`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE project_collaborators DROP COLUMN IF EXISTS local_directory`.execute(db);
}
