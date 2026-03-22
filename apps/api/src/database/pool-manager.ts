import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { Db } from './client.js';
import type { TeamDatabase } from './types.js';
import { decrypt } from '../lib/encryption.js';

export type TeamDb = Kysely<TeamDatabase>;

interface PoolEntry {
  readonly db: TeamDb;
  lastAccessedAt: number;
}

export interface DbPoolManager {
  getDbForProject(localDb: Db, projectId: string): Promise<TeamDb | null>;
  closeAll(): Promise<void>;
}

export function createPoolManager(jwtSecret: string, maxPools: number = 5): DbPoolManager {
  const pools = new Map<string, PoolEntry>();
  let cleanupTimer: ReturnType<typeof setInterval> | null = null;

  function startCleanup(): void {
    if (cleanupTimer) return;
    cleanupTimer = setInterval(async () => {
      const now = Date.now();
      const idleThreshold = 5 * 60 * 1000; // 5 minutes

      for (const [projectId, entry] of pools) {
        if (now - entry.lastAccessedAt > idleThreshold) {
          pools.delete(projectId);
          await entry.db.destroy().catch(() => {});
        }
      }

      if (pools.size === 0 && cleanupTimer) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
      }
    }, 60_000);
  }

  async function evictOldest(): Promise<void> {
    if (pools.size < maxPools) return;

    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of pools) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = pools.get(oldestKey);
      pools.delete(oldestKey);
      await entry?.db.destroy().catch(() => {});
    }
  }

  function createTeamDb(connectionUrl: string, sslEnabled: boolean): TeamDb {
    const dialect = new PostgresDialect({
      pool: new pg.Pool({
        connectionString: connectionUrl,
        max: 5,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
        ssl: sslEnabled ? { rejectUnauthorized: true } : false,
      }),
    });

    return new Kysely<TeamDatabase>({ dialect });
  }

  return {
    async getDbForProject(localDb: Db, projectId: string): Promise<TeamDb | null> {
      // Check cache first
      const cached = pools.get(projectId);
      if (cached) {
        cached.lastAccessedAt = Date.now();
        return cached.db;
      }

      // Look up config from local DB
      const config = await localDb
        .selectFrom('project_db_configs')
        .select(['connection_url', 'ssl_enabled', 'status'])
        .where('project_id', '=', projectId)
        .where('status', '=', 'active')
        .executeTakeFirst();

      if (!config) return null;

      // Decrypt connection URL
      const connectionUrl = decrypt(config.connection_url, jwtSecret);

      // Evict oldest if at capacity
      await evictOldest();

      // Create new pool
      const db = createTeamDb(connectionUrl, config.ssl_enabled);
      pools.set(projectId, { db, lastAccessedAt: Date.now() });
      startCleanup();

      return db;
    },

    async closeAll(): Promise<void> {
      if (cleanupTimer) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
      }

      const destroyPromises = [...pools.values()].map((entry) =>
        entry.db.destroy().catch(() => {}),
      );
      pools.clear();
      await Promise.all(destroyPromises);
    },
  };
}
