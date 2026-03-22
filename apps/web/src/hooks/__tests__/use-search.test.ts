import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders, waitFor } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../api/search.api', () => ({
  searchApi: { search: vi.fn() },
}));

import { useAuthStore } from '../../stores/auth.store';
import { searchApi } from '../../api/search.api';
import { useSearch } from '../use-search';

describe('useSearch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when no projectId', () => {
    vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: null }));
    const { result } = renderHookWithProviders(() => useSearch('test'));
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled when query is too short', () => {
    vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
    const { result } = renderHookWithProviders(() => useSearch('t'));
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches with valid projectId and query', async () => {
    vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'p1' }));
    vi.mocked(searchApi.search).mockResolvedValue({
      success: true,
      data: { results: [], total: 0 },
      error: null,
    });

    const { result } = renderHookWithProviders(() => useSearch('hello'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(searchApi.search).toHaveBeenCalledWith('p1', 'hello', 'all');
  });
});
