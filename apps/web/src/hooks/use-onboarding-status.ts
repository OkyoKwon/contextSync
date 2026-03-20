import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth.store';
import { projectsApi } from '../api/projects.api';

export type OnboardingStatus = 'loading' | 'needs-project' | 'ready';

export function useOnboardingStatus(): OnboardingStatus {
  const token = useAuthStore((s) => s.token);
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
    enabled: !!token && !currentProjectId,
  });

  const projects = data?.data ?? [];

  useEffect(() => {
    const first = projects[0];
    if (first && !currentProjectId) {
      setCurrentProject(first.id);
    }
  }, [projects, currentProjectId, setCurrentProject]);

  if (currentProjectId) return 'ready';
  if (isLoading) return 'loading';
  return 'needs-project';
}
