import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    post: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    patch: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    delete: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    upload: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
  },
}));

import { sessionsApi } from '../sessions.api';
import { api } from '../client';

describe('sessionsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list builds query string from filter', async () => {
    await sessionsApi.list('proj-1', { status: 'active', userId: 'u1' });
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/projects/proj-1/sessions?'));
    const callArg = vi.mocked(api.get).mock.calls[0]![0];
    expect(callArg).toContain('status=active');
    expect(callArg).toContain('userId=u1');
  });

  it('list without filter has no query string', async () => {
    await sessionsApi.list('proj-1');
    expect(api.get).toHaveBeenCalledWith('/projects/proj-1/sessions');
  });

  it('get calls GET /sessions/:id', async () => {
    await sessionsApi.get('sess-1');
    expect(api.get).toHaveBeenCalledWith('/sessions/sess-1');
  });

  it('import calls upload', async () => {
    const file = new File([''], 'test.jsonl');
    await sessionsApi.import('proj-1', file);
    expect(api.upload).toHaveBeenCalledWith('/projects/proj-1/sessions/import', file);
  });

  it('update calls PATCH /sessions/:id', async () => {
    await sessionsApi.update('sess-1', { title: 'New Title' });
    expect(api.patch).toHaveBeenCalledWith('/sessions/sess-1', { title: 'New Title' });
  });

  it('delete calls DELETE /sessions/:id', async () => {
    await sessionsApi.delete('sess-1');
    expect(api.delete).toHaveBeenCalledWith('/sessions/sess-1');
  });

  it('timeline builds query string', async () => {
    await sessionsApi.timeline('proj-1', { status: 'completed' } as any);
    const callArg = vi.mocked(api.get).mock.calls[0]![0];
    expect(callArg).toContain('/projects/proj-1/timeline?');
    expect(callArg).toContain('status=completed');
  });

  it('stats calls GET /projects/:id/stats', async () => {
    await sessionsApi.stats('proj-1');
    expect(api.get).toHaveBeenCalledWith('/projects/proj-1/stats');
  });

  it('teamStats calls GET /projects/:id/team-stats', async () => {
    await sessionsApi.teamStats('proj-1');
    expect(api.get).toHaveBeenCalledWith('/projects/proj-1/team-stats');
  });

  it('tokenUsage includes period param', async () => {
    await sessionsApi.tokenUsage('proj-1', '7d');
    expect(api.get).toHaveBeenCalledWith('/projects/proj-1/token-usage?period=7d');
  });

  it('listLocal includes projectId and activeOnly params', async () => {
    await sessionsApi.listLocal('proj-1', false);
    expect(api.get).toHaveBeenCalledWith('/sessions/local?projectId=proj-1&activeOnly=false');
  });

  it('sync calls POST with sessionIds', async () => {
    await sessionsApi.sync('proj-1', ['s1', 's2']);
    expect(api.post).toHaveBeenCalledWith('/projects/proj-1/sessions/sync', {
      sessionIds: ['s1', 's2'],
    });
  });

  it('recalculateTokens calls POST', async () => {
    await sessionsApi.recalculateTokens('proj-1');
    expect(api.post).toHaveBeenCalledWith('/projects/proj-1/sessions/recalculate-tokens');
  });
});
