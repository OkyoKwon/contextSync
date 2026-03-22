import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders, waitFor } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../api/projects.api', () => ({
  projectsApi: { get: vi.fn() },
}));

import { useAuthStore } from '../../stores/auth.store';
import { projectsApi } from '../../api/projects.api';
import { useCurrentProject } from '../use-current-project';

describe('useCurrentProject', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when projectId is null', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({ currentProjectId: null }),
    );

    const { result } = renderHookWithProviders(() => useCurrentProject());
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled when projectId is "skipped"', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({ currentProjectId: 'skipped' }),
    );

    const { result } = renderHookWithProviders(() => useCurrentProject());
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches when projectId exists', async () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({ currentProjectId: 'proj-1' }),
    );
    vi.mocked(projectsApi.get).mockResolvedValue({
      success: true,
      data: { id: 'proj-1', name: 'Test' } as any,
      error: null,
    });

    const { result } = renderHookWithProviders(() => useCurrentProject());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(projectsApi.get).toHaveBeenCalledWith('proj-1');
  });
});
