import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders, waitFor } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../api/sessions.api', () => ({
  sessionsApi: {
    list: vi.fn(),
    get: vi.fn(),
    import: vi.fn(),
    timeline: vi.fn(),
    tokenUsage: vi.fn(),
    recalculateTokens: vi.fn(),
    stats: vi.fn(),
    teamStats: vi.fn(),
  },
}));

import { useAuthStore } from '../../stores/auth.store';
import { sessionsApi } from '../../api/sessions.api';
import {
  useSessions,
  useSession,
  useImportSession,
  useTimeline,
  useTokenUsage,
  useDashboardStats,
  useTeamStats,
} from '../use-sessions';

describe('useSessions hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('useSessions', () => {
    it('is disabled when no projectId', () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: null }));
      const { result } = renderHookWithProviders(() => useSessions());
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches with projectId and filter', async () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
      vi.mocked(sessionsApi.list).mockResolvedValue({ success: true, data: [], error: null });

      const filter = { status: 'active' } as any;
      const { result } = renderHookWithProviders(() => useSessions(filter));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(sessionsApi.list).toHaveBeenCalledWith('p1', filter);
    });
  });

  describe('useSession', () => {
    it('is disabled with empty sessionId', () => {
      const { result } = renderHookWithProviders(() => useSession(''));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches with valid sessionId', async () => {
      vi.mocked(sessionsApi.get).mockResolvedValue({ success: true, data: {} as any, error: null });
      const { result } = renderHookWithProviders(() => useSession('sess-1'));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(sessionsApi.get).toHaveBeenCalledWith('sess-1');
    });
  });

  describe('useImportSession', () => {
    it('returns mutate function', () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
      const { result } = renderHookWithProviders(() => useImportSession());
      expect(result.current.mutate).toBeDefined();
    });
  });

  describe('useTimeline', () => {
    it('is disabled when projectId is "skipped"', () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'skipped' }));
      const { result } = renderHookWithProviders(() => useTimeline());
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useTokenUsage', () => {
    it('fetches with default period', async () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
      vi.mocked(sessionsApi.tokenUsage).mockResolvedValue({
        success: true,
        data: {} as any,
        error: null,
      });

      const { result } = renderHookWithProviders(() => useTokenUsage());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(sessionsApi.tokenUsage).toHaveBeenCalledWith('p1', '30d');
    });
  });

  describe('useDashboardStats', () => {
    it('fetches with projectId', async () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
      vi.mocked(sessionsApi.stats).mockResolvedValue({
        success: true,
        data: {} as any,
        error: null,
      });

      const { result } = renderHookWithProviders(() => useDashboardStats());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(sessionsApi.stats).toHaveBeenCalledWith('p1');
    });
  });

  describe('useTeamStats', () => {
    it('is disabled without projectId', () => {
      vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: null }));
      const { result } = renderHookWithProviders(() => useTeamStats());
      expect(result.current.fetchStatus).toBe('idle');
    });
  });
});
