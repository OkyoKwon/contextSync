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

import { setupApi } from '../setup.api';

setupMsw();

describe('setupApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'test-token' });
  });

  it('getStatus returns database status', async () => {
    const status = {
      databaseMode: 'local',
      provider: 'local',
      host: 'localhost',
      remoteUrl: null,
    };
    server.use(
      http.get('/api/setup/status', () =>
        HttpResponse.json({ success: true, data: status, error: null }),
      ),
    );

    const result = await setupApi.getStatus();
    expect(result.data).toEqual(status);
  });

  it('testConnection sends connectionUrl and sslEnabled', async () => {
    let capturedBody: any = null;
    const testResult = { success: true, latencyMs: 42, version: '16.1', error: null };
    server.use(
      http.post('/api/setup/test-connection', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, data: testResult, error: null });
      }),
    );

    const result = await setupApi.testConnection('postgresql://localhost/test', true);
    expect(capturedBody).toEqual({
      connectionUrl: 'postgresql://localhost/test',
      sslEnabled: true,
    });
    expect(result.data).toEqual(testResult);
  });

  it('switchToRemote sends connectionUrl, sslEnabled, and projectId', async () => {
    let capturedBody: any = null;
    const switchResult = { requiresRestart: false, migrationsApplied: ['001', '002'] };
    server.use(
      http.post('/api/setup/switch-to-remote', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, data: switchResult, error: null });
      }),
    );

    const result = await setupApi.switchToRemote('postgresql://remote/db', false, 'proj-1');
    expect(capturedBody).toEqual({
      connectionUrl: 'postgresql://remote/db',
      sslEnabled: false,
      projectId: 'proj-1',
    });
    expect(result.data).toEqual(switchResult);
  });

  it('throws on server error for GET endpoints', async () => {
    server.use(
      http.get('/api/setup/status', () =>
        HttpResponse.json({ error: 'Database unreachable' }, { status: 500 }),
      ),
    );

    await expect(setupApi.getStatus()).rejects.toThrow('Database unreachable');
  });

  it('throws on server error for POST endpoints', async () => {
    server.use(
      http.post('/api/setup/test-connection', () =>
        HttpResponse.json({ error: 'Connection refused' }, { status: 500 }),
      ),
    );

    await expect(setupApi.testConnection('postgresql://bad/url', false)).rejects.toThrow(
      'Connection refused',
    );
  });
});
