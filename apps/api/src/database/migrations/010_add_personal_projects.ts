import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE projects ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE CASCADE`.execute(db);

  await sql`ALTER TABLE projects ALTER COLUMN team_id DROP NOT NULL`.execute(db);

  await sql`
    ALTER TABLE projects ADD CONSTRAINT chk_project_ownership
    CHECK (
      (team_id IS NOT NULL AND owner_id IS NULL) OR
      (team_id IS NULL AND owner_id IS NOT NULL)
    )
  `.execute(db);

  await sql`CREATE INDEX idx_projects_owner_id ON projects(owner_id)`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_projects_owner_id`.execute(db);
  await sql`ALTER TABLE projects DROP CONSTRAINT IF EXISTS chk_project_ownership`.execute(db);
  await sql`ALTER TABLE projects ALTER COLUMN team_id SET NOT NULL`.execute(db);
  await sql`ALTER TABLE projects DROP COLUMN IF EXISTS owner_id`.execute(db);
}
