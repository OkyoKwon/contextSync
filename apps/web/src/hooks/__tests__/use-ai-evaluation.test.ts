import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import {
  createAuthStoreMock,
  setMockAuthState,
  resetMockAuthState,
} from '../../test/mocks/auth-store.mock';
import { renderHookWithProviders, waitFor, setupMsw } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => createAuthStoreMock());

import {
  useTeamEvaluationSummary,
  useStartEvaluation,
  useLatestEvaluation,
  useEvaluationDetail,
  useEvaluationHistory,
  useBackfillTranslations,
  useLatestEvaluationGroup,
  useEvaluationGroupHistory,
  useLearningGuide,
  useRegenerateLearningGuide,
  useDeleteEvaluationGroup,
} from '../use-ai-evaluation';

setupMsw();

describe('useAiEvaluation hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
  });

  describe('useTeamEvaluationSummary', () => {
    it('is disabled without projectId', () => {
      const { result } = renderHookWithProviders(() => useTeamEvaluationSummary());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('is disabled when projectId is "skipped"', () => {
      setMockAuthState({ currentProjectId: 'skipped' });
      const { result } = renderHookWithProviders(() => useTeamEvaluationSummary());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches team summary with projectId', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const summary = [{ userId: 'u1', userName: 'Alice', averageScore: 85, evaluationCount: 3 }];
      server.use(
        http.get('/api/projects/p1/ai-evaluation/summary', () =>
          HttpResponse.json({ success: true, data: summary, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useTeamEvaluationSummary());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toHaveLength(1);
      expect(result.current.data?.data?.[0]!.userId).toBe('u1');
    });

    it('transitions to error on API failure', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      server.use(
        http.get('/api/projects/p1/ai-evaluation/summary', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 }),
        ),
      );

      const { result } = renderHookWithProviders(() => useTeamEvaluationSummary());
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useLatestEvaluation', () => {
    it('is disabled without targetUserId', () => {
      setMockAuthState({ currentProjectId: 'p1' });
      const { result } = renderHookWithProviders(() => useLatestEvaluation(null));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('is disabled without projectId', () => {
      const { result } = renderHookWithProviders(() => useLatestEvaluation('u1'));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches latest evaluation with projectId and targetUserId', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const evaluation = { id: 'ev-1', score: 90, targetUserId: 'u1' };
      let capturedUrl = '';
      server.use(
        http.get('/api/projects/p1/ai-evaluation/latest', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ success: true, data: evaluation, error: null });
        }),
      );

      const { result } = renderHookWithProviders(() => useLatestEvaluation('u1'));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain('targetUserId=u1');
      expect(result.current.data?.data?.id).toBe('ev-1');
    });
  });

  describe('useEvaluationDetail', () => {
    it('is disabled without evaluationId', () => {
      setMockAuthState({ currentProjectId: 'p1' });
      const { result } = renderHookWithProviders(() => useEvaluationDetail(null));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('is disabled without projectId', () => {
      const { result } = renderHookWithProviders(() => useEvaluationDetail('ev-1'));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches evaluation detail', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const detail = { id: 'ev-1', overallScore: 85, categories: [] };
      server.use(
        http.get('/api/projects/p1/ai-evaluation/ev-1', () =>
          HttpResponse.json({ success: true, data: detail, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useEvaluationDetail('ev-1'));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data?.id).toBe('ev-1');
      expect(result.current.data?.data?.overallScore).toBe(85);
    });
  });

  describe('useEvaluationHistory', () => {
    it('is disabled without targetUserId', () => {
      setMockAuthState({ currentProjectId: 'p1' });
      const { result } = renderHookWithProviders(() => useEvaluationHistory(null));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('is disabled without projectId', () => {
      const { result } = renderHookWithProviders(() => useEvaluationHistory('u1'));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches evaluation history', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const history = [
        { id: 'ev-1', score: 85, createdAt: '2025-03-01T00:00:00Z' },
        { id: 'ev-2', score: 90, createdAt: '2025-03-02T00:00:00Z' },
      ];
      let capturedUrl = '';
      server.use(
        http.get('/api/projects/p1/ai-evaluation/history', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ success: true, data: history, error: null });
        }),
      );

      const { result } = renderHookWithProviders(() => useEvaluationHistory('u1', 2));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain('targetUserId=u1');
      expect(capturedUrl).toContain('page=2');
      expect(result.current.data?.data).toHaveLength(2);
    });
  });

  describe('useStartEvaluation', () => {
    it('returns mutate function', () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const { result } = renderHookWithProviders(() => useStartEvaluation());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls evaluate endpoint', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      let capturedBody: any = null;
      server.use(
        http.post('/api/projects/p1/ai-evaluation/evaluate', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            success: true,
            data: { id: 'ev-new', status: 'processing' },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useStartEvaluation());
      result.current.mutate({ targetUserId: 'u1' } as any);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedBody).toEqual({ targetUserId: 'u1' });
    });
  });

  describe('useBackfillTranslations', () => {
    it('returns mutate function', () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const { result } = renderHookWithProviders(() => useBackfillTranslations());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls backfill-translations endpoint', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      server.use(
        http.post('/api/projects/p1/ai-evaluation/backfill-translations', () =>
          HttpResponse.json({
            success: true,
            data: { processed: 5, failed: 0 },
            error: null,
          }),
        ),
      );

      const { result } = renderHookWithProviders(() => useBackfillTranslations());
      result.current.mutate(20);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toEqual({ processed: 5, failed: 0 });
    });
  });

  describe('useLatestEvaluationGroup', () => {
    it('is disabled without targetUserId', () => {
      setMockAuthState({ currentProjectId: 'p1' });
      const { result } = renderHookWithProviders(() => useLatestEvaluationGroup(null));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('is disabled without projectId', () => {
      const { result } = renderHookWithProviders(() => useLatestEvaluationGroup('u1'));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches latest evaluation group', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const group = { groupId: 'g1', claude: null, chatgpt: null, gemini: null };
      server.use(
        http.get('/api/projects/p1/ai-evaluation/latest-group', () =>
          HttpResponse.json({ success: true, data: group, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useLatestEvaluationGroup('u1'));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data?.groupId).toBe('g1');
    });
  });

  describe('useEvaluationGroupHistory', () => {
    it('is disabled without targetUserId', () => {
      setMockAuthState({ currentProjectId: 'p1' });
      const { result } = renderHookWithProviders(() => useEvaluationGroupHistory(null));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches evaluation group history', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const history = [{ groupId: 'g1', perspectives: [] }];
      server.use(
        http.get('/api/projects/p1/ai-evaluation/group-history', () =>
          HttpResponse.json({ success: true, data: history, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useEvaluationGroupHistory('u1', 1));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toHaveLength(1);
    });
  });

  describe('useLearningGuide', () => {
    it('is disabled without groupId', () => {
      setMockAuthState({ currentProjectId: 'p1' });
      const { result } = renderHookWithProviders(() => useLearningGuide(null));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches learning guide', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const guide = { id: 'lg-1', status: 'completed', content: 'Guide content' };
      server.use(
        http.get('/api/projects/p1/ai-evaluation/group/g1/learning-guide', () =>
          HttpResponse.json({ success: true, data: guide, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useLearningGuide('g1'));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data?.status).toBe('completed');
    });
  });

  describe('useRegenerateLearningGuide', () => {
    it('returns mutate function', () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const { result } = renderHookWithProviders(() => useRegenerateLearningGuide());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls regenerate endpoint', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      server.use(
        http.post('/api/projects/p1/ai-evaluation/group/g1/learning-guide/regenerate', () =>
          HttpResponse.json({
            success: true,
            data: { id: 'lg-2', status: 'pending' },
            error: null,
          }),
        ),
      );

      const { result } = renderHookWithProviders(() => useRegenerateLearningGuide());
      result.current.mutate('g1');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useDeleteEvaluationGroup', () => {
    it('returns mutate function', () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const { result } = renderHookWithProviders(() => useDeleteEvaluationGroup());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls delete endpoint', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      server.use(
        http.delete('/api/projects/p1/ai-evaluation/group/g1', () =>
          HttpResponse.json({
            success: true,
            data: { deleted: true },
            error: null,
          }),
        ),
      );

      const { result } = renderHookWithProviders(() => useDeleteEvaluationGroup());
      result.current.mutate('g1');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toEqual({ deleted: true });
    });
  });
});
