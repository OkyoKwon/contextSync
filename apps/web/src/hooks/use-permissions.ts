import { useMemo } from 'react';
import type { UserRole } from '@context-sync/shared';
import { useAuthStore } from '../stores/auth.store';
import { useCurrentProject } from './use-current-project';
import { useCollaborators } from './use-collaborators';

export interface ProjectPermissions {
  readonly isOwner: boolean;
  readonly isAdmin: boolean;
  readonly isMember: boolean;
  readonly canEditProject: boolean;
  readonly canManageCollaborators: boolean;
  readonly canDeleteProject: boolean;
  readonly canEditOthersSessions: boolean;
  readonly role: UserRole | null;
}

export function usePermissions(): ProjectPermissions {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const { data: projectData } = useCurrentProject();
  const { data: collabData } = useCollaborators(currentProjectId ?? '');

  return useMemo(() => {
    const project = projectData?.data ?? null;
    const collaborators = collabData?.data ?? [];

    if (!project || !currentUserId) {
      return {
        isOwner: false,
        isAdmin: false,
        isMember: false,
        canEditProject: false,
        canManageCollaborators: false,
        canDeleteProject: false,
        canEditOthersSessions: false,
        role: null,
      };
    }

    const isOwner = project.ownerId === currentUserId;

    if (isOwner) {
      return {
        isOwner: true,
        isAdmin: false,
        isMember: false,
        canEditProject: true,
        canManageCollaborators: true,
        canDeleteProject: true,
        canEditOthersSessions: true,
        role: 'owner' as UserRole,
      };
    }

    const collab = collaborators.find((c) => c.userId === currentUserId);
    const role = collab?.role ?? null;
    const isAdmin = role === 'admin';

    return {
      isOwner: false,
      isAdmin,
      isMember: role === 'member',
      canEditProject: isAdmin,
      canManageCollaborators: isAdmin,
      canDeleteProject: false,
      canEditOthersSessions: isAdmin,
      role,
    };
  }, [projectData, collabData, currentUserId]);
}
