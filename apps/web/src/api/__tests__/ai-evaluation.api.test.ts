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

import { aiEvaluationApi } from '../ai-evaluation.api';

setupMsw();

describe('aiEvaluationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'test-token' });
  });

  it('triggerEvaluation sends input in body', async () => {
    let capturedBody: any = null;
    const evaluation = { id: 'eval-1', score: 90 };
    server.use(
      http.post('/api/projects/:projectId/ai-evaluation/evaluate', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, data: evaluation, error: null });
      }),
    );

    const input = { targetUserId: 'u1' } as any;
    const result = await aiEvaluationApi.triggerEvaluation('proj-1', input);
    expect(capturedBody).toEqual({ targetUserId: 'u1' });
    expect(result.data).toEqual(evaluation);
  });

  it('getLatestEvaluation builds query params', async () => {
    let capturedUrl = '';
    const evaluation = { id: 'eval-1', score: 85 };
    server.use(
      http.get('/api/projects/:projectId/ai-evaluation/latest', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: evaluation, error: null });
      }),
    );

    const result = await aiEvaluationApi.getLatestEvaluation('proj-1', 'user-1');
    const url = new URL(capturedUrl);
    expect(url.searchParams.get('targetUserId')).toBe('user-1');
    expect(result.data).toEqual(evaluation);
  });

  it('getEvaluationHistory builds query params with pagination', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/projects/:projectId/ai-evaluation/history', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], error: null });
      }),
    );

    await aiEvaluationApi.getEvaluationHistory('proj-1', 'user-1', 2, 10);
    const url = new URL(capturedUrl);
    expect(url.searchParams.get('targetUserId')).toBe('user-1');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('limit')).toBe('10');
  });

  it('getEvaluationDetail returns evaluation with details', async () => {
    const detail = { id: 'eval-1', score: 88, criteria: [] };
    server.use(
      http.get('/api/projects/:projectId/ai-evaluation/:evaluationId', () =>
        HttpResponse.json({ success: true, data: detail, error: null }),
      ),
    );

    const result = await aiEvaluationApi.getEvaluationDetail('proj-1', 'eval-1');
    expect(result.data).toEqual(detail);
  });

  it('getTeamSummary returns summary entries', async () => {
    const summary = [
      { userId: 'u1', averageScore: 90 },
      { userId: 'u2', averageScore: 75 },
    ];
    server.use(
      http.get('/api/projects/:projectId/ai-evaluation/summary', () =>
        HttpResponse.json({ success: true, data: summary, error: null }),
      ),
    );

    const result = await aiEvaluationApi.getTeamSummary('proj-1');
    expect(result.data).toEqual(summary);
  });

  it('throws on server error for GET endpoints', async () => {
    server.use(
      http.get('/api/projects/:projectId/ai-evaluation/summary', () =>
        HttpResponse.json({ error: 'Internal error' }, { status: 500 }),
      ),
    );

    await expect(aiEvaluationApi.getTeamSummary('proj-1')).rejects.toThrow('Internal error');
  });

  it('throws on server error for POST endpoints', async () => {
    server.use(
      http.post('/api/projects/:projectId/ai-evaluation/evaluate', () =>
        HttpResponse.json({ error: 'Evaluation failed' }, { status: 500 }),
      ),
    );

    await expect(
      aiEvaluationApi.triggerEvaluation('proj-1', { targetUserId: 'u1' } as any),
    ).rejects.toThrow('Evaluation failed');
  });

  it('getLatestEvaluationGroup builds query params', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/projects/:projectId/ai-evaluation/latest-group', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          success: true,
          data: { groupId: 'g1', claude: null, chatgpt: null, gemini: null },
          error: null,
        });
      }),
    );

    const result = await aiEvaluationApi.getLatestEvaluationGroup('proj-1', 'user-1');
    const url = new URL(capturedUrl);
    expect(url.searchParams.get('targetUserId')).toBe('user-1');
    expect(result.data).toBeDefined();
  });

  it('getEvaluationGroup fetches by groupId', async () => {
    const group = { groupId: 'g1', claude: null, chatgpt: null, gemini: null };
    server.use(
      http.get('/api/projects/:projectId/ai-evaluation/group/:groupId', () =>
        HttpResponse.json({ success: true, data: group, error: null }),
      ),
    );

    const result = await aiEvaluationApi.getEvaluationGroup('proj-1', 'g1');
    expect(result.data).toEqual(group);
  });

  it('getEvaluationGroupHistory builds query params with pagination', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/projects/:projectId/ai-evaluation/group-history', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], error: null });
      }),
    );

    await aiEvaluationApi.getEvaluationGroupHistory('proj-1', 'user-1', 3, 15);
    const url = new URL(capturedUrl);
    expect(url.searchParams.get('targetUserId')).toBe('user-1');
    expect(url.searchParams.get('page')).toBe('3');
    expect(url.searchParams.get('limit')).toBe('15');
  });

  it('backfillTranslations sends POST with limit', async () => {
    let capturedBody: any = null;
    server.use(
      http.post(
        '/api/projects/:projectId/ai-evaluation/backfill-translations',
        async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            success: true,
            data: { processed: 5, failed: 0 },
            error: null,
          });
        },
      ),
    );

    const result = await aiEvaluationApi.backfillTranslations('proj-1', 20);
    expect(capturedBody).toEqual({ limit: 20 });
    expect(result.data).toEqual({ processed: 5, failed: 0 });
  });

  it('backfillTranslations uses default limit of 10', async () => {
    let capturedBody: any = null;
    server.use(
      http.post(
        '/api/projects/:projectId/ai-evaluation/backfill-translations',
        async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            success: true,
            data: { processed: 3, failed: 1 },
            error: null,
          });
        },
      ),
    );

    await aiEvaluationApi.backfillTranslations('proj-1');
    expect(capturedBody).toEqual({ limit: 10 });
  });

  it('getLearningGuide fetches by groupId', async () => {
    const guide = { id: 'lg-1', status: 'completed', content: 'Learn more' };
    server.use(
      http.get('/api/projects/:projectId/ai-evaluation/group/:groupId/learning-guide', () =>
        HttpResponse.json({ success: true, data: guide, error: null }),
      ),
    );

    const result = await aiEvaluationApi.getLearningGuide('proj-1', 'g1');
    expect(result.data).toEqual(guide);
  });

  it('regenerateLearningGuide sends POST', async () => {
    let wasCalled = false;
    server.use(
      http.post(
        '/api/projects/:projectId/ai-evaluation/group/:groupId/learning-guide/regenerate',
        () => {
          wasCalled = true;
          return HttpResponse.json({
            success: true,
            data: { id: 'lg-2', status: 'pending' },
            error: null,
          });
        },
      ),
    );

    await aiEvaluationApi.regenerateLearningGuide('proj-1', 'g1');
    expect(wasCalled).toBe(true);
  });

  it('deleteEvaluationGroup sends DELETE', async () => {
    let wasCalled = false;
    server.use(
      http.delete('/api/projects/:projectId/ai-evaluation/group/:groupId', () => {
        wasCalled = true;
        return HttpResponse.json({
          success: true,
          data: { deleted: true },
          error: null,
        });
      }),
    );

    const result = await aiEvaluationApi.deleteEvaluationGroup('proj-1', 'g1');
    expect(wasCalled).toBe(true);
    expect(result.data).toEqual({ deleted: true });
  });
});
