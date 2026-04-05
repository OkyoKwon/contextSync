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

import { sessionsApi } from '../sessions.api';

setupMsw();

describe('sessionsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'test-token' });
  });

  it('list returns parsed session data', async () => {
    const sessions = [{ id: 's1', title: 'Session 1' }];
    server.use(
      http.get('/api/projects/proj-1/sessions', () =>
        HttpResponse.json({ success: true, data: sessions, error: null }),
      ),
    );

    const result = await sessionsApi.list('proj-1');
    expect(result.data).toEqual(sessions);
  });

  it('list builds query string from filter', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/projects/proj-1/sessions', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], error: null });
      }),
    );

    await sessionsApi.list('proj-1', { status: 'active', userId: 'u1' } as any);
    expect(capturedUrl).toContain('status=active');
    expect(capturedUrl).toContain('userId=u1');
  });

  it('list without filter has no query string', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/projects/proj-1/sessions', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], error: null });
      }),
    );

    await sessionsApi.list('proj-1');
    expect(capturedUrl).not.toContain('?');
  });

  it('get returns session with messages', async () => {
    const session = { id: 'sess-1', title: 'Test', messages: [{ role: 'user', content: 'hi' }] };
    server.use(
      http.get('/api/sessions/sess-1', () =>
        HttpResponse.json({ success: true, data: session, error: null }),
      ),
    );

    const result = await sessionsApi.get('sess-1');
    expect(result.data?.id).toBe('sess-1');
  });

  it('import uploads file via FormData', async () => {
    server.use(
      http.post('/api/projects/proj-1/sessions/import', async () => {
        return HttpResponse.json({
          success: true,
          data: { session: { id: 'new-sess' }, messageCount: 3, detectedConflicts: 0 },
          error: null,
        });
      }),
    );

    const file = new File(['{"messages":[]}'], 'test.json', { type: 'application/json' });
    const result = await sessionsApi.import('proj-1', file);
    expect(result.data?.session.id).toBe('new-sess');
  });

  it('update sends PATCH with input', async () => {
    let capturedBody: any = null;
    server.use(
      http.patch('/api/sessions/sess-1', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          success: true,
          data: { id: 'sess-1', title: 'New Title' },
          error: null,
        });
      }),
    );

    await sessionsApi.update('sess-1', { title: 'New Title' });
    expect(capturedBody).toEqual({ title: 'New Title' });
  });

  it('delete sends DELETE request', async () => {
    let wasCalled = false;
    server.use(
      http.delete('/api/sessions/sess-1', () => {
        wasCalled = true;
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    await sessionsApi.delete('sess-1');
    expect(wasCalled).toBe(true);
  });

  it('timeline builds query string from filter', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/projects/proj-1/timeline', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], error: null });
      }),
    );

    await sessionsApi.timeline('proj-1', { status: 'completed' } as any);
    expect(capturedUrl).toContain('status=completed');
  });

  it('stats returns dashboard stats', async () => {
    const stats = { todaySessions: 5, activeSessions: 2, totalTokens: 1000, totalCost: 0.5 };
    server.use(
      http.get('/api/projects/proj-1/stats', () =>
        HttpResponse.json({ success: true, data: stats, error: null }),
      ),
    );

    const result = await sessionsApi.stats('proj-1');
    expect(result.data?.todaySessions).toBe(5);
  });

  it('teamStats returns member activities', async () => {
    const teamStats = [{ userId: 'u1', name: 'Alice', sessionCount: 3 }];
    server.use(
      http.get('/api/projects/proj-1/team-stats', () =>
        HttpResponse.json({ success: true, data: teamStats, error: null }),
      ),
    );

    const result = await sessionsApi.teamStats('proj-1');
    expect(result.data).toHaveLength(1);
  });

  it('tokenUsage includes period param', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/projects/proj-1/token-usage', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          success: true,
          data: {
            period: '7d',
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalCost: 0,
            dailyUsage: [],
          },
          error: null,
        });
      }),
    );

    await sessionsApi.tokenUsage('proj-1', '7d');
    expect(capturedUrl).toContain('period=7d');
  });

  it('sync sends POST with sessionIds', async () => {
    let capturedBody: any = null;
    server.use(
      http.post('/api/projects/proj-1/sessions/sync', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, data: { syncedCount: 2 }, error: null });
      }),
    );

    await sessionsApi.sync('proj-1', ['s1', 's2']);
    expect(capturedBody).toEqual({ sessionIds: ['s1', 's2'] });
  });

  it('recalculateTokens calls POST', async () => {
    let wasCalled = false;
    server.use(
      http.post('/api/projects/proj-1/sessions/recalculate-tokens', () => {
        wasCalled = true;
        return HttpResponse.json({ success: true, data: { updatedCount: 5 }, error: null });
      }),
    );

    await sessionsApi.recalculateTokens('proj-1');
    expect(wasCalled).toBe(true);
  });

  it('throws on server error', async () => {
    server.use(
      http.get('/api/projects/proj-1/sessions', () =>
        HttpResponse.json({ error: 'Internal error' }, { status: 500 }),
      ),
    );

    await expect(sessionsApi.list('proj-1')).rejects.toThrow('Internal error');
  });
});
