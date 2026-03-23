import { useMemo } from 'react';
import type { UserRole } from '@context-sync/shared';
import { useAuthStore } from '../stores/auth.store';
import { useCurrentProject } from './use-current-project';

export interface ProjectPermissions {
  readonly isOwner: boolean;
  readonly isMember: boolean;
  readonly canEditProject: boolean;
  readonly canManageCollaborators: boolean;
  readonly canDeleteProject: boolean;
  readonly canEditOthersSessions: boolean;
  readonly role: UserRole | null;
}

export function usePermissions(): ProjectPermissions {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: projectData } = useCurrentProject();

  return useMemo(() => {
    const project = projectData?.data ?? null;

    if (!project || !currentUserId) {
      return {
        isOwner: false,
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
        isMember: false,
        canEditProject: true,
        canManageCollaborators: true,
        canDeleteProject: true,
        canEditOthersSessions: true,
        role: 'owner' as UserRole,
      };
    }

    return {
      isOwner: false,
      isMember: true,
      canEditProject: false,
      canManageCollaborators: false,
      canDeleteProject: false,
      canEditOthersSessions: false,
      role: 'member' as UserRole,
    };
  }, [projectData, currentUserId]);
}
