import type { FastifyPluginAsync } from 'fastify';
import {
  detectSyncTasks,
  executeAutoSync,
} from '../modules/local-sessions/local-session.auto-sync.js';

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
      const tasks = await detectSyncTasks(app.localDb, userId);
      if (tasks.length > 0) {
        const report = await executeAutoSync(app.localDb, userId, tasks);
        app.log.info(
          `[auto-sync] Completed: ${report.newSynced} new, ${report.updated} updated, ${report.errors} errors`,
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
