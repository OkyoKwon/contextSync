import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders, waitFor } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../api/prd-analysis.api', () => ({
  prdAnalysisApi: {
    listDocuments: vi.fn(),
    uploadDocument: vi.fn(),
    deleteDocument: vi.fn(),
    startAnalysis: vi.fn(),
    getLatestAnalysis: vi.fn(),
    getAnalysisHistory: vi.fn(),
    getAnalysisDetail: vi.fn(),
  },
}));

import { useAuthStore } from '../../stores/auth.store';
import { prdAnalysisApi } from '../../api/prd-analysis.api';
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

describe('usePrdAnalysis hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('usePrdDocuments', () => {
    it('is disabled without projectId', () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: null }));
      const { result } = renderHookWithProviders(() => usePrdDocuments());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches with projectId', async () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
      vi.mocked(prdAnalysisApi.listDocuments).mockResolvedValue({
        success: true,
        data: [],
        error: null,
      });
      const { result } = renderHookWithProviders(() => usePrdDocuments());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useLatestPrdAnalysis', () => {
    it('is disabled when skipped', () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'skipped' }));
      const { result } = renderHookWithProviders(() => useLatestPrdAnalysis());
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('usePrdAnalysisHistory', () => {
    it('fetches with projectId and page', async () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
      vi.mocked(prdAnalysisApi.getAnalysisHistory).mockResolvedValue({
        success: true,
        data: [],
        error: null,
      });
      const { result } = renderHookWithProviders(() => usePrdAnalysisHistory(2));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(prdAnalysisApi.getAnalysisHistory).toHaveBeenCalledWith('p1', 2);
    });
  });

  describe('usePrdAnalysisDetail', () => {
    it('is disabled when analysisId is null', () => {
      const { result } = renderHookWithProviders(() => usePrdAnalysisDetail(null));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches with valid analysisId', async () => {
      vi.mocked(prdAnalysisApi.getAnalysisDetail).mockResolvedValue({
        success: true,
        data: {} as any,
        error: null,
      });
      const { result } = renderHookWithProviders(() => usePrdAnalysisDetail('a-1'));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('mutation hooks', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
    });

    it('useUploadPrdDocument returns mutate', () => {
      const { result } = renderHookWithProviders(() => useUploadPrdDocument());
      expect(result.current.mutate).toBeDefined();
    });

    it('useDeletePrdDocument returns mutate', () => {
      const { result } = renderHookWithProviders(() => useDeletePrdDocument());
      expect(result.current.mutate).toBeDefined();
    });

    it('useStartAnalysis returns mutate', () => {
      const { result } = renderHookWithProviders(() => useStartAnalysis());
      expect(result.current.mutate).toBeDefined();
    });

    it('useReplacePrdDocument returns mutate', () => {
      const { result } = renderHookWithProviders(() => useReplacePrdDocument());
      expect(result.current.mutate).toBeDefined();
    });
  });
});
