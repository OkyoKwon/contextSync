import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders, waitFor } from '../../test/test-utils';

vi.mock('../../api/projects.api', () => ({
  projectsApi: { listCollaborators: vi.fn() },
}));

import { projectsApi } from '../../api/projects.api';
import { useCollaborators } from '../use-collaborators';

describe('useCollaborators', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when projectId is null', () => {
    const { result } = renderHookWithProviders(() => useCollaborators(null));
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled when projectId is "skipped"', () => {
    const { result } = renderHookWithProviders(() => useCollaborators('skipped'));
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches when projectId exists', async () => {
    vi.mocked(projectsApi.listCollaborators).mockResolvedValue({
      success: true,
      data: [],
      error: null,
    });

    const { result } = renderHookWithProviders(() => useCollaborators('proj-1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(projectsApi.listCollaborators).toHaveBeenCalledWith('proj-1');
  });
});
