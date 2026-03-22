import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Add a user as a project collaborator directly via SQL.
 * This bypasses the join code flow which is useful for tests
 * that need collaborators but aren't testing the join flow itself.
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
