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

import { conflictsApi } from '../conflicts.api';

setupMsw();

describe('conflictsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'test-token' });
  });

  it('list returns parsed conflict data', async () => {
    const conflicts = [{ id: 'c1', severity: 'warning', status: 'open' }];
    server.use(
      http.get('/api/projects/proj-1/conflicts', () =>
        HttpResponse.json({ success: true, data: conflicts, error: null }),
      ),
    );

    const result = await conflictsApi.list('proj-1');
    expect(result.data).toEqual(conflicts);
  });

  it('list builds query string from filter', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/projects/proj-1/conflicts', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], error: null });
      }),
    );

    await conflictsApi.list('proj-1', { severity: 'high' } as any);
    expect(capturedUrl).toContain('severity=high');
  });

  it('list without filter has no query string', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/projects/proj-1/conflicts', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], error: null });
      }),
    );

    await conflictsApi.list('proj-1');
    expect(capturedUrl).not.toContain('?');
  });

  it('get returns single conflict', async () => {
    const conflict = { id: 'c-1', severity: 'critical', filePath: '/src/main.ts' };
    server.use(
      http.get('/api/conflicts/c-1', () =>
        HttpResponse.json({ success: true, data: conflict, error: null }),
      ),
    );

    const result = await conflictsApi.get('c-1');
    expect(result.data?.id).toBe('c-1');
  });

  it('update sends PATCH with input', async () => {
    let capturedBody: any = null;
    server.use(
      http.patch('/api/conflicts/c-1', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          success: true,
          data: { id: 'c-1', status: 'resolved' },
          error: null,
        });
      }),
    );

    await conflictsApi.update('c-1', { status: 'resolved' } as any);
    expect(capturedBody).toEqual({ status: 'resolved' });
  });

  it('assignReviewer sends PATCH with reviewerId', async () => {
    let capturedBody: any = null;
    server.use(
      http.patch('/api/conflicts/c-1/assign', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, data: { id: 'c-1' }, error: null });
      }),
    );

    await conflictsApi.assignReviewer('c-1', 'user-1');
    expect(capturedBody).toEqual({ reviewerId: 'user-1' });
  });

  it('addReviewNotes sends PATCH with reviewNotes', async () => {
    let capturedBody: any = null;
    server.use(
      http.patch('/api/conflicts/c-1/review-notes', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, data: { id: 'c-1' }, error: null });
      }),
    );

    await conflictsApi.addReviewNotes('c-1', 'Looks good');
    expect(capturedBody).toEqual({ reviewNotes: 'Looks good' });
  });

  it('batchResolve sends PATCH with status', async () => {
    let capturedBody: any = null;
    server.use(
      http.patch('/api/projects/proj-1/conflicts/batch-resolve', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          success: true,
          data: { count: 3 },
          error: null,
        });
      }),
    );

    const result = await conflictsApi.batchResolve('proj-1', 'resolved');
    expect(capturedBody).toEqual({ status: 'resolved' });
    expect(result.data).toEqual({ count: 3 });
  });

  it('aiVerify sends POST to ai-verify endpoint', async () => {
    let wasCalled = false;
    server.use(
      http.post('/api/conflicts/c-1/ai-verify', () => {
        wasCalled = true;
        return HttpResponse.json({
          success: true,
          data: { id: 'c-1', aiVerified: true },
          error: null,
        });
      }),
    );

    await conflictsApi.aiVerify('c-1');
    expect(wasCalled).toBe(true);
  });

  it('overviewAnalysis sends POST for project overview', async () => {
    let wasCalled = false;
    server.use(
      http.post('/api/projects/proj-1/conflicts/overview-analysis', () => {
        wasCalled = true;
        return HttpResponse.json({
          success: true,
          data: { summary: 'All clear', totalConflicts: 0 },
          error: null,
        });
      }),
    );

    const result = await conflictsApi.overviewAnalysis('proj-1');
    expect(wasCalled).toBe(true);
    expect(result.data?.summary).toBe('All clear');
  });

  it('throws on server error', async () => {
    server.use(
      http.get('/api/projects/proj-1/conflicts', () =>
        HttpResponse.json({ error: 'Internal error' }, { status: 500 }),
      ),
    );

    await expect(conflictsApi.list('proj-1')).rejects.toThrow('Internal error');
  });
});
