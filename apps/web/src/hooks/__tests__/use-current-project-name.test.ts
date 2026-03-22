import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../use-projects', () => ({
  useProjects: vi.fn(),
}));

import { useAuthStore } from '../../stores/auth.store';
import { useProjects } from '../use-projects';
import { useCurrentProjectName } from '../use-current-project-name';

const mockUseAuthStore = vi.mocked(useAuthStore);
const mockUseProjects = vi.mocked(useProjects);

describe('useCurrentProjectName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no currentProjectId', () => {
    mockUseAuthStore.mockImplementation((selector: any) => selector({ currentProjectId: null }));
    mockUseProjects.mockReturnValue({ data: undefined } as any);

    const { result } = renderHookWithProviders(() => useCurrentProjectName());
    expect(result.current).toBeNull();
  });

  it('returns null when currentProjectId is "skipped"', () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ currentProjectId: 'skipped' }),
    );
    mockUseProjects.mockReturnValue({ data: undefined } as any);

    const { result } = renderHookWithProviders(() => useCurrentProjectName());
    expect(result.current).toBeNull();
  });

  it('returns project name when found', () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ currentProjectId: 'proj-1' }),
    );
    mockUseProjects.mockReturnValue({
      data: { data: [{ id: 'proj-1', name: 'My Project' }] },
    } as any);

    const { result } = renderHookWithProviders(() => useCurrentProjectName());
    expect(result.current).toBe('My Project');
  });

  it('returns null when project not found in list', () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ currentProjectId: 'proj-999' }),
    );
    mockUseProjects.mockReturnValue({
      data: { data: [{ id: 'proj-1', name: 'My Project' }] },
    } as any);

    const { result } = renderHookWithProviders(() => useCurrentProjectName());
    expect(result.current).toBeNull();
  });
});
