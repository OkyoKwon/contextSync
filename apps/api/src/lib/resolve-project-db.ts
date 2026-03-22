import type { FastifyInstance } from 'fastify';
import type { Db } from '../database/client.js';

/**
 * Resolves the correct database for a project.
 * Returns the remote DB if configured and active, otherwise the local DB.
 *
 * The remote DB (TeamDatabase) contains a subset of the tables in Database,
 * covering all session/data-related tables. We cast to Db for compatibility
 * since the calling services only access tables that exist in both schemas.
 */
export async function resolveProjectDb(app: FastifyInstance, projectId: string): Promise<Db> {
  const remoteDb = await app.poolManager.getDbForProject(app.db, projectId);
  return (remoteDb as unknown as Db) ?? app.db;
}
