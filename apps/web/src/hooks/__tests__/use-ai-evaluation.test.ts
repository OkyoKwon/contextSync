import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders, waitFor } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../api/ai-evaluation.api', () => ({
  aiEvaluationApi: {
    getTeamSummary: vi.fn(),
    triggerEvaluation: vi.fn(),
    getLatestEvaluation: vi.fn(),
    getEvaluationDetail: vi.fn(),
    getEvaluationHistory: vi.fn(),
  },
}));

import { useAuthStore } from '../../stores/auth.store';
import { aiEvaluationApi } from '../../api/ai-evaluation.api';
import {
  useTeamEvaluationSummary,
  useStartEvaluation,
  useLatestEvaluation,
  useEvaluationDetail,
  useEvaluationHistory,
} from '../use-ai-evaluation';

describe('useAiEvaluation hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('useTeamEvaluationSummary', () => {
    it('is disabled without projectId', () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: null }));
      const { result } = renderHookWithProviders(() => useTeamEvaluationSummary());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches with projectId', async () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
      vi.mocked(aiEvaluationApi.getTeamSummary).mockResolvedValue({
        success: true,
        data: [],
        error: null,
      });
      const { result } = renderHookWithProviders(() => useTeamEvaluationSummary());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useLatestEvaluation', () => {
    it('is disabled without targetUserId', () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
      const { result } = renderHookWithProviders(() => useLatestEvaluation(null));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches with projectId and targetUserId', async () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
      vi.mocked(aiEvaluationApi.getLatestEvaluation).mockResolvedValue({
        success: true,
        data: {} as any,
        error: null,
      });
      const { result } = renderHookWithProviders(() => useLatestEvaluation('u1'));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useEvaluationDetail', () => {
    it('is disabled without evaluationId', () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
      const { result } = renderHookWithProviders(() => useEvaluationDetail(null));
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useEvaluationHistory', () => {
    it('is disabled without targetUserId', () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
      const { result } = renderHookWithProviders(() => useEvaluationHistory(null));
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useStartEvaluation', () => {
    it('returns mutate', () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
      const { result } = renderHookWithProviders(() => useStartEvaluation());
      expect(result.current.mutate).toBeDefined();
    });
  });
});
