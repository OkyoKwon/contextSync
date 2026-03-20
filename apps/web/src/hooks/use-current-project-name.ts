import { useMemo } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { useProjects } from './use-projects';

export function useCurrentProjectName(): string | null {
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const { data } = useProjects();

  return useMemo(() => {
    if (!currentProjectId || currentProjectId === 'skipped') return null;
    const projects = data?.data ?? [];
    const found = projects.find((p) => p.id === currentProjectId);
    return found?.name ?? null;
  }, [currentProjectId, data]);
}
