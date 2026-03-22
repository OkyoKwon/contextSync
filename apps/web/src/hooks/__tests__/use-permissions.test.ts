import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../use-current-project', () => ({
  useCurrentProject: vi.fn(),
}));

vi.mock('../use-collaborators', () => ({
  useCollaborators: vi.fn(),
}));

import { useAuthStore } from '../../stores/auth.store';
import { useCurrentProject } from '../use-current-project';
import { useCollaborators } from '../use-collaborators';
import { usePermissions } from '../use-permissions';

const mockUseAuthStore = vi.mocked(useAuthStore);
const mockUseCurrentProject = vi.mocked(useCurrentProject);
const mockUseCollaborators = vi.mocked(useCollaborators);

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all false when no project', () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: null, currentProjectId: null }),
    );
    mockUseCurrentProject.mockReturnValue({ data: undefined } as any);
    mockUseCollaborators.mockReturnValue({ data: undefined } as any);

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
    mockUseCollaborators.mockReturnValue({ data: { data: [] } } as any);

    const { result } = renderHookWithProviders(() => usePermissions());
    expect(result.current.isOwner).toBe(true);
    expect(result.current.canEditProject).toBe(true);
    expect(result.current.canDeleteProject).toBe(true);
    expect(result.current.canManageCollaborators).toBe(true);
    expect(result.current.role).toBe('owner');
  });

  it('returns admin permissions for admin collaborator', () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: { id: 'user-2' }, currentProjectId: 'proj-1' }),
    );
    mockUseCurrentProject.mockReturnValue({
      data: { data: { id: 'proj-1', ownerId: 'user-1' } },
    } as any);
    mockUseCollaborators.mockReturnValue({
      data: { data: [{ userId: 'user-2', role: 'admin' }] },
    } as any);

    const { result } = renderHookWithProviders(() => usePermissions());
    expect(result.current.isOwner).toBe(false);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.canEditProject).toBe(true);
    expect(result.current.canDeleteProject).toBe(false);
    expect(result.current.role).toBe('admin');
  });

  it('returns member permissions for member collaborator', () => {
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: { id: 'user-3' }, currentProjectId: 'proj-1' }),
    );
    mockUseCurrentProject.mockReturnValue({
      data: { data: { id: 'proj-1', ownerId: 'user-1' } },
    } as any);
    mockUseCollaborators.mockReturnValue({
      data: { data: [{ userId: 'user-3', role: 'member' }] },
    } as any);

    const { result } = renderHookWithProviders(() => usePermissions());
    expect(result.current.isOwner).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isMember).toBe(true);
    expect(result.current.canEditProject).toBe(false);
    expect(result.current.canDeleteProject).toBe(false);
    expect(result.current.canManageCollaborators).toBe(false);
    expect(result.current.role).toBe('member');
  });
});
