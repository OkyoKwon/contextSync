import { useMemo } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { usePersonalProjects, useProjects } from './use-projects';

export function useCurrentProjectName(): string | null {
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const { data: personalData } = usePersonalProjects();
  const { data: teamData } = useProjects();

  return useMemo(() => {
    if (!currentProjectId || currentProjectId === 'skipped') return null;

    const personalProjects = personalData?.data ?? [];
    const teamProjects = teamData?.data ?? [];

    const found =
      personalProjects.find((p) => p.id === currentProjectId) ??
      teamProjects.find((p) => p.id === currentProjectId);

    return found?.name ?? null;
  }, [currentProjectId, personalData, teamData]);
}
