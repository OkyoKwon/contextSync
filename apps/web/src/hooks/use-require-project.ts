import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { useProjects } from './use-projects';

export function useRequireProject(): {
  readonly isProjectSelected: boolean;
  readonly isLoading: boolean;
} {
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);
  const { data, isLoading } = useProjects();
  const projects = data?.data ?? [];

  const hasValidId = currentProjectId !== null && currentProjectId !== 'skipped';
  const projectExists = hasValidId && projects.some((p) => p.id === currentProjectId);

  // Auto-clear stale project ID once project list is loaded
  useEffect(() => {
    if (!isLoading && hasValidId && !projectExists) {
      setCurrentProject(null);
    }
  }, [isLoading, hasValidId, projectExists, setCurrentProject]);

  return {
    isProjectSelected: projectExists,
    isLoading,
  };
}
