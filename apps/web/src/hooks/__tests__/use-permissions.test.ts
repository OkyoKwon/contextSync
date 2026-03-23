import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../use-current-project', () => ({
  useCurrentProject: vi.fn(),
}));

import { useAuthStore } from '../../stores/auth.store';
import { useCurrentProject } from '../use-current-project';
import { usePermissions } from '../use-permissions';

const mockUseAuthStore = vi.mocked(useAuthStore);
const mockUseCurrentProject = vi.mocked(useCurrentProject);

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all false when no project', () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: null, currentProjectId: null }),
    );
    mockUseCurrentProject.mockReturnValue({ data: undefined } as any);

    const { result } = renderHookWithProviders(() => usePermissions());
    expect(result.current.isOwner).toBe(false);
    expect(result.current.role).toBeNull();
    expect(result.current.canEditProject).toBe(false);
  });

  it('returns owner permissions when user is project owner', () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: { id: 'user-1' }, currentProjectId: 'proj-1' }),
    );
    mockUseCurrentProject.mockReturnValue({
      data: { data: { id: 'proj-1', ownerId: 'user-1' } },
    } as any);

    const { result } = renderHookWithProviders(() => usePermissions());
    expect(result.current.isOwner).toBe(true);
    expect(result.current.canEditProject).toBe(true);
    expect(result.current.canDeleteProject).toBe(true);
    expect(result.current.canManageCollaborators).toBe(true);
    expect(result.current.role).toBe('owner');
  });

  it('returns member permissions for non-owner', () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: { id: 'user-2' }, currentProjectId: 'proj-1' }),
    );
    mockUseCurrentProject.mockReturnValue({
      data: { data: { id: 'proj-1', ownerId: 'user-1' } },
    } as any);

    const { result } = renderHookWithProviders(() => usePermissions());
    expect(result.current.isOwner).toBe(false);
    expect(result.current.isMember).toBe(true);
    expect(result.current.canEditProject).toBe(false);
    expect(result.current.canDeleteProject).toBe(false);
    expect(result.current.canManageCollaborators).toBe(false);
    expect(result.current.role).toBe('member');
  });
});
