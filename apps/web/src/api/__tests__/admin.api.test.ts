import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import {
  createAuthStoreMock,
  setMockAuthState,
  resetMockAuthState,
} from '../../test/mocks/auth-store.mock';
import { setupMsw } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => createAuthStoreMock());

import { adminApi } from '../admin.api';

setupMsw();

describe('adminApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'test-token' });
  });

  it('getStatus returns admin status', async () => {
    const status = { databaseMode: 'local', version: '1.0.0' };
    server.use(
      http.get('/api/admin/status', () =>
        HttpResponse.json({ success: true, data: status, error: null }),
      ),
    );

    const result = await adminApi.getStatus();
    expect(result.data).toEqual(status);
  });

  it('runMigrations returns migration result', async () => {
    const migrationResult = { applied: ['001', '002'], pending: 0 };
    server.use(
      http.post('/api/admin/migrations/run', () =>
        HttpResponse.json({ success: true, data: migrationResult, error: null }),
      ),
    );

    const result = await adminApi.runMigrations();
    expect(result.data).toEqual(migrationResult);
  });

  it('getConfig returns admin config', async () => {
    const config = { autoSync: true, syncInterval: 30000 };
    server.use(
      http.get('/api/admin/config', () =>
        HttpResponse.json({ success: true, data: config, error: null }),
      ),
    );

    const result = await adminApi.getConfig();
    expect(result.data).toEqual(config);
  });

  it('getStatus throws on server error', async () => {
    server.use(
      http.get('/api/admin/status', () =>
        HttpResponse.json({ error: 'Forbidden' }, { status: 403 }),
      ),
    );

    await expect(adminApi.getStatus()).rejects.toThrow('Forbidden');
  });

  it('runMigrations throws on server error', async () => {
    server.use(
      http.post('/api/admin/migrations/run', () =>
        HttpResponse.json({ error: 'Migration failed' }, { status: 500 }),
      ),
    );

    await expect(adminApi.runMigrations()).rejects.toThrow('Migration failed');
  });
});
