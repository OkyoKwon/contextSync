import type { FastifyPluginAsync } from 'fastify';
import {
  detectSyncTasks,
  executeAutoSync,
  type AutoSyncTask,
} from '../modules/local-sessions/local-session.auto-sync.js';
import { ensureUserOnRemote } from '../lib/project-sync.js';

function groupTasksByProject(
  tasks: readonly AutoSyncTask[],
): ReadonlyMap<string, readonly AutoSyncTask[]> {
  const map = new Map<string, AutoSyncTask[]>();
  for (const task of tasks) {
    const existing = map.get(task.projectId) ?? [];
    map.set(task.projectId, [...existing, task]);
  }
  return map;
}

export const autoSyncPlugin: FastifyPluginAsync = async (app) => {
  const intervalMs = app.env.AUTO_SYNC_INTERVAL_MS;

  if (intervalMs === 0) {
    app.log.info('[auto-sync] Disabled (AUTO_SYNC_INTERVAL_MS=0)');
    return;
  }

  if (intervalMs < 5000) {
    app.log.warn('[auto-sync] Interval too short, using minimum 5000ms');
  }

  const effectiveInterval = Math.max(intervalMs, 5000);
  let isRunning = false;
  let intervalHandle: NodeJS.Timeout | null = null;

  async function runAutoSync(): Promise<void> {
    if (isRunning) return;

    const userId = app.lastAuthUserId;
    if (!userId) return;

    isRunning = true;
    try {
      const tasks = await detectSyncTasks(app.localDb, userId, app.resolveDb);
      if (tasks.length > 0) {
        const grouped = groupTasksByProject(tasks);
        let totalNew = 0;
        let totalUpdated = 0;
        let totalErrors = 0;

        for (const [projectId, projectTasks] of grouped) {
          const db = await app.resolveDb(projectId);

          // Ensure user FK exists on remote before writing sessions
          if (db !== app.localDb) {
            await ensureUserOnRemote(app.localDb, db, userId);
          }

          const report = await executeAutoSync(db, userId, projectTasks);
          totalNew += report.newSynced;
          totalUpdated += report.updated;
          totalErrors += report.errors;
        }

        app.log.info(
          `[auto-sync] Completed: ${totalNew} new, ${totalUpdated} updated, ${totalErrors} errors`,
        );
      }
    } catch (err) {
      app.log.error({ err }, '[auto-sync] Failed');
    } finally {
      isRunning = false;
    }
  }

  app.addHook('onReady', async () => {
    intervalHandle = setInterval(runAutoSync, effectiveInterval);
    app.log.info(`[auto-sync] Started (interval: ${effectiveInterval}ms)`);
  });

  app.addHook('onClose', async () => {
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
  });
};
