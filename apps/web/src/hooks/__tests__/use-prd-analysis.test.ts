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
  usePrdDocuments,
  useUploadPrdDocument,
  useDeletePrdDocument,
  useStartAnalysis,
  useLatestPrdAnalysis,
  usePrdAnalysisHistory,
  useReplacePrdDocument,
  usePrdAnalysisDetail,
} from '../use-prd-analysis';

setupMsw();

describe('usePrdAnalysis hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
  });

  describe('usePrdDocuments', () => {
    it('is disabled without projectId', () => {
      const { result } = renderHookWithProviders(() => usePrdDocuments());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('is disabled when projectId is "skipped"', () => {
      setMockAuthState({ currentProjectId: 'skipped' });
      const { result } = renderHookWithProviders(() => usePrdDocuments());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches documents with projectId', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const docs = [{ id: 'doc-1', title: 'PRD v1', filename: 'prd.md', projectId: 'p1' }];
      server.use(
        http.get('/api/projects/p1/prd/documents', () =>
          HttpResponse.json({ success: true, data: docs, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => usePrdDocuments());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toHaveLength(1);
      expect(result.current.data?.data?.[0].id).toBe('doc-1');
    });

    it('transitions to error on API failure', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      server.use(
        http.get('/api/projects/p1/prd/documents', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 }),
        ),
      );

      const { result } = renderHookWithProviders(() => usePrdDocuments());
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useLatestPrdAnalysis', () => {
    it('is disabled when skipped', () => {
      setMockAuthState({ currentProjectId: 'skipped' });
      const { result } = renderHookWithProviders(() => useLatestPrdAnalysis());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('is disabled without projectId', () => {
      const { result } = renderHookWithProviders(() => useLatestPrdAnalysis());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches latest analysis', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const analysis = { id: 'a-1', status: 'completed', requirements: [] };
      server.use(
        http.get('/api/projects/p1/prd/analysis/latest', () =>
          HttpResponse.json({ success: true, data: analysis, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useLatestPrdAnalysis());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data?.id).toBe('a-1');
    });
  });

  describe('usePrdAnalysisHistory', () => {
    it('fetches with projectId and page', async () => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
      const history = [{ id: 'a-1', createdAt: '2025-03-01T00:00:00Z' }];
      let capturedUrl = '';
      server.use(
        http.get('/api/projects/p1/prd/analysis/history', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ success: true, data: history, error: null });
        }),
      );

      const { result } = renderHookWithProviders(() => usePrdAnalysisHistory(2));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedUrl).toContain('page=2');
      expect(result.current.data?.data).toHaveLength(1);
    });

    it('is disabled without projectId', () => {
      const { result } = renderHookWithProviders(() => usePrdAnalysisHistory());
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('usePrdAnalysisDetail', () => {
    it('is disabled when analysisId is null', () => {
      const { result } = renderHookWithProviders(() => usePrdAnalysisDetail(null));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches with valid analysisId', async () => {
      setMockAuthState({ token: 'tok' });
      const detail = { id: 'a-1', status: 'completed', requirements: [{ id: 'r1' }] };
      server.use(
        http.get('/api/prd/analysis/a-1', () =>
          HttpResponse.json({ success: true, data: detail, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => usePrdAnalysisDetail('a-1'));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data?.id).toBe('a-1');
      expect(result.current.data?.data?.requirements).toHaveLength(1);
    });

    it('transitions to error on API failure', async () => {
      setMockAuthState({ token: 'tok' });
      server.use(
        http.get('/api/prd/analysis/a-1', () =>
          HttpResponse.json({ error: 'Not found' }, { status: 404 }),
        ),
      );

      const { result } = renderHookWithProviders(() => usePrdAnalysisDetail('a-1'));
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('mutation hooks', () => {
    beforeEach(() => {
      setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
    });

    it('useUploadPrdDocument returns mutate', () => {
      const { result } = renderHookWithProviders(() => useUploadPrdDocument());
      expect(result.current.mutate).toBeDefined();
    });

    it('useUploadPrdDocument calls upload endpoint', async () => {
      let capturedBody = false;
      server.use(
        http.post('/api/projects/p1/prd/documents', () => {
          capturedBody = true;
          return HttpResponse.json({
            success: true,
            data: { id: 'doc-new', title: 'Uploaded', filename: 'prd.md', projectId: 'p1' },
            error: null,
          });
        }),
      );

      const { result } = renderHookWithProviders(() => useUploadPrdDocument());
      const file = new File(['# PRD'], 'prd.md', { type: 'text/markdown' });
      result.current.mutate({ file, title: 'My PRD' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedBody).toBe(true);
    });

    it('useDeletePrdDocument returns mutate', () => {
      const { result } = renderHookWithProviders(() => useDeletePrdDocument());
      expect(result.current.mutate).toBeDefined();
    });

    it('useDeletePrdDocument calls delete endpoint', async () => {
      server.use(
        http.delete('/api/prd/documents/doc-1', () =>
          HttpResponse.json({ success: true, data: null, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useDeletePrdDocument());
      result.current.mutate('doc-1');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('useStartAnalysis returns mutate', () => {
      const { result } = renderHookWithProviders(() => useStartAnalysis());
      expect(result.current.mutate).toBeDefined();
    });

    it('useStartAnalysis calls analyze endpoint', async () => {
      server.use(
        http.post('/api/projects/p1/prd/analyze', () =>
          HttpResponse.json({
            success: true,
            data: { id: 'a-new', status: 'processing', requirements: [] },
            error: null,
          }),
        ),
      );

      const { result } = renderHookWithProviders(() => useStartAnalysis());
      result.current.mutate('doc-1');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('useReplacePrdDocument returns mutate', () => {
      const { result } = renderHookWithProviders(() => useReplacePrdDocument());
      expect(result.current.mutate).toBeDefined();
    });
  });
});
