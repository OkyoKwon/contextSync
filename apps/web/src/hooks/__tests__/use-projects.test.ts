import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders, waitFor } from '../../test/test-utils';

vi.mock('../../api/projects.api', () => ({
  projectsApi: { list: vi.fn() },
}));

import { projectsApi } from '../../api/projects.api';
import { useProjects } from '../use-projects';

describe('useProjects', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls projectsApi.list', async () => {
    vi.mocked(projectsApi.list).mockResolvedValue({
      success: true,
      data: [],
      error: null,
    });

    const { result } = renderHookWithProviders(() => useProjects());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(projectsApi.list).toHaveBeenCalled();
  });
});
