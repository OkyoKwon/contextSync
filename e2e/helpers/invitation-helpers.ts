import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Insert an active remote DB config for a project directly via SQL.
 * This is required before creating invitations or adding collaborators
 * through the API, since the remote DB check was introduced.
 */
export async function activateRemoteDb(db: Kysely<unknown>, projectId: string): Promise<void> {
  await sql`
    INSERT INTO project_db_configs (project_id, connection_url, provider, ssl_enabled, status, schema_version)
    VALUES (${projectId}, 'encrypted-test-url', 'self-hosted', false, 'active', 9)
    ON CONFLICT (project_id) DO NOTHING
  `.execute(db);
}

/**
 * Add a user as a project collaborator directly via SQL.
 * This bypasses the invitation flow which is useful for tests
 * that need collaborators but aren't testing the invitation flow itself.
 */
export async function addCollaborator(
  db: Kysely<unknown>,
  projectId: string,
  userId: string,
  role: string = 'member',
): Promise<void> {
  await sql`
    INSERT INTO project_collaborators (project_id, user_id, role)
    VALUES (${projectId}, ${userId}, ${role})
    ON CONFLICT (project_id, user_id) DO NOTHING
  `.execute(db);
}

/**
 * Get invitation token from the database.
 * Only works when the API server and test fixture use the same database.
 */
export async function getInvitationToken(
  db: Kysely<unknown>,
  invitationId: string,
): Promise<string | null> {
  const result = await sql<{ token: string }>`
    SELECT token FROM project_invitations WHERE id = ${invitationId}
  `.execute(db);

  return result.rows[0]?.token ?? null;
}

/**
 * Get the latest invitation token for a given email in a project.
 */
export async function getInvitationTokenByEmail(
  db: Kysely<unknown>,
  projectId: string,
  email: string,
): Promise<string | null> {
  const result = await sql<{ token: string }>`
    SELECT token FROM project_invitations
    WHERE project_id = ${projectId} AND email = ${email}
    ORDER BY created_at DESC LIMIT 1
  `.execute(db);

  return result.rows[0]?.token ?? null;
}
