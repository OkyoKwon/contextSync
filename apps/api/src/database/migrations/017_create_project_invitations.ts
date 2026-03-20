import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE project_invitations (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      inviter_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email         VARCHAR(255) NOT NULL,
      token         VARCHAR(64) NOT NULL UNIQUE,
      role          VARCHAR(20) NOT NULL DEFAULT 'member',
      status        VARCHAR(20) NOT NULL DEFAULT 'pending',
      expires_at    TIMESTAMPTZ NOT NULL,
      accepted_at   TIMESTAMPTZ,
      declined_at   TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX uq_invitation_project_email_pending
      ON project_invitations(project_id, email) WHERE status = 'pending'
  `.execute(db);

  await sql`CREATE INDEX idx_invitations_token ON project_invitations(token)`.execute(db);
  await sql`CREATE INDEX idx_invitations_email ON project_invitations(email)`.execute(db);
  await sql`CREATE INDEX idx_invitations_project_id ON project_invitations(project_id)`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS project_invitations`.execute(db);
}
