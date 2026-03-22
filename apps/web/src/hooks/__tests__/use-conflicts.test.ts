import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders, waitFor } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../api/conflicts.api', () => ({
  conflictsApi: {
    list: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    assignReviewer: vi.fn(),
    addReviewNotes: vi.fn(),
  },
}));

import { useAuthStore } from '../../stores/auth.store';
import { conflictsApi } from '../../api/conflicts.api';
import {
  useConflicts,
  useConflict,
  useUpdateConflict,
  useAssignReviewer,
  useAddReviewNotes,
} from '../use-conflicts';

describe('useConflicts hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('useConflicts', () => {
    it('is disabled when no projectId', () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: null }));
      const { result } = renderHookWithProviders(() => useConflicts());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('respects enabled option', () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
      const { result } = renderHookWithProviders(() => useConflicts(undefined, { enabled: false }));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches with projectId', async () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
      vi.mocked(conflictsApi.list).mockResolvedValue({ success: true, data: [], error: null });

      const { result } = renderHookWithProviders(() => useConflicts());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(conflictsApi.list).toHaveBeenCalledWith('p1', undefined);
    });
  });

  describe('useConflict', () => {
    it('is disabled with empty conflictId', () => {
      const { result } = renderHookWithProviders(() => useConflict(''));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches with valid conflictId', async () => {
      vi.mocked(conflictsApi.get).mockResolvedValue({
        success: true,
        data: {} as any,
        error: null,
      });
      const { result } = renderHookWithProviders(() => useConflict('c-1'));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('mutation hooks', () => {
    it('useUpdateConflict returns mutate', () => {
      const { result } = renderHookWithProviders(() => useUpdateConflict());
      expect(result.current.mutate).toBeDefined();
    });

    it('useAssignReviewer returns mutate', () => {
      const { result } = renderHookWithProviders(() => useAssignReviewer());
      expect(result.current.mutate).toBeDefined();
    });

    it('useAddReviewNotes returns mutate', () => {
      const { result } = renderHookWithProviders(() => useAddReviewNotes());
      expect(result.current.mutate).toBeDefined();
    });
  });
});
