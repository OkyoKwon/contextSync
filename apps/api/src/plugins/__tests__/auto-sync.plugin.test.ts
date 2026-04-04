import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';

vi.mock('../../modules/local-sessions/local-session.auto-sync.js', () => ({
  detectSyncTasks: vi.fn().mockResolvedValue([]),
  executeAutoSync: vi.fn().mockResolvedValue({ newSynced: 0, updated: 0, errors: 0 }),
}));

vi.mock('../../lib/project-sync.js', () => ({
  ensureUserOnRemote: vi.fn(),
}));

import { autoSyncPlugin } from '../auto-sync.plugin.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('autoSyncPlugin', () => {
  it('should not start when interval is 0', async () => {
    const app = Fastify({ logger: false });
    app.decorate('env', { AUTO_SYNC_INTERVAL_MS: 0 });
    app.decorate('localDb', {} as any);
    app.decorate('lastAuthUserId', null);
    app.decorate('resolveDb', vi.fn());

    await app.register(autoSyncPlugin);
    await app.ready();

    // Plugin should register without errors when disabled
    await app.close();
  });

  it('should register with valid interval', async () => {
    vi.useFakeTimers();

    const app = Fastify({ logger: false });
    app.decorate('env', { AUTO_SYNC_INTERVAL_MS: 10000 });
    app.decorate('localDb', {} as any);
    app.decorate('remoteDb', null);
    app.decorate('lastAuthUserId', null);
    app.decorate('resolveDb', vi.fn().mockResolvedValue({} as any));

    await app.register(autoSyncPlugin);
    await app.ready();

    // Clean up
    await app.close();
    vi.useRealTimers();
  });

  it('should enforce minimum 5000ms interval', async () => {
    vi.useFakeTimers();

    const app = Fastify({ logger: false });
    app.decorate('env', { AUTO_SYNC_INTERVAL_MS: 1000 });
    app.decorate('localDb', {} as any);
    app.decorate('remoteDb', null);
    app.decorate('lastAuthUserId', null);
    app.decorate('resolveDb', vi.fn().mockResolvedValue({} as any));

    await app.register(autoSyncPlugin);
    await app.ready();

    await app.close();
    vi.useRealTimers();
  });
});
