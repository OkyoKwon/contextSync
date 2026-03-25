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
});
