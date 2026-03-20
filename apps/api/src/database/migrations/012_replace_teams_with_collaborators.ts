import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Create project_collaborators table
  await sql`
    CREATE TABLE project_collaborators (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL DEFAULT 'member',
      added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(project_id, user_id)
    )
  `.execute(db);

  await sql`CREATE INDEX idx_project_collaborators_project_id ON project_collaborators(project_id)`.execute(db);
  await sql`CREATE INDEX idx_project_collaborators_user_id ON project_collaborators(user_id)`.execute(db);

  // 2. Drop chk_project_ownership constraint before updating owner_id
  await sql`ALTER TABLE projects DROP CONSTRAINT IF EXISTS chk_project_ownership`.execute(db);

  // 3. For team projects, set owner_id from team_members (role='owner', or earliest joined)
  await sql`
    UPDATE projects
    SET owner_id = sub.user_id
    FROM (
      SELECT DISTINCT ON (tm.team_id) tm.team_id, tm.user_id
      FROM team_members tm
      ORDER BY tm.team_id, (tm.role = 'owner') DESC, tm.joined_at ASC
    ) sub
    WHERE projects.team_id = sub.team_id
      AND projects.owner_id IS NULL
  `.execute(db);

  // 3. Copy team_members → project_collaborators for each team project
  await sql`
    INSERT INTO project_collaborators (project_id, user_id, role, added_at)
    SELECT p.id, tm.user_id, tm.role, tm.joined_at
    FROM projects p
    INNER JOIN team_members tm ON tm.team_id = p.team_id
    WHERE p.team_id IS NOT NULL
    ON CONFLICT (project_id, user_id) DO NOTHING
  `.execute(db);

  // 4. Drop team_id column from projects
  await sql`ALTER TABLE projects DROP COLUMN IF EXISTS team_id`.execute(db);

  // 6. Add NOT NULL constraint on owner_id
  await sql`ALTER TABLE projects ALTER COLUMN owner_id SET NOT NULL`.execute(db);

  // 7. Drop team_members, teams tables
  await sql`DROP TABLE IF EXISTS team_members`.execute(db);
  await sql`DROP TABLE IF EXISTS teams`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Recreate teams + team_members
  await sql`
    CREATE TABLE teams (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      settings JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);

  await sql`
    CREATE TABLE team_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL DEFAULT 'member',
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(team_id, user_id)
    )
  `.execute(db);

  // Re-add team_id column
  await sql`ALTER TABLE projects ALTER COLUMN owner_id DROP NOT NULL`.execute(db);
  await sql`ALTER TABLE projects ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE`.execute(db);
  await sql`
    ALTER TABLE projects ADD CONSTRAINT chk_project_ownership
    CHECK (
      (team_id IS NOT NULL AND owner_id IS NULL) OR
      (team_id IS NULL AND owner_id IS NOT NULL)
    )
  `.execute(db);

  // Drop project_collaborators
  await sql`DROP TABLE IF EXISTS project_collaborators`.execute(db);
}
