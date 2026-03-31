import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth.store';
import { projectsApi } from '../api/projects.api';

export type OnboardingStatus = 'loading' | 'needs-project' | 'ready' | 'error';

export function useOnboardingStatus(): OnboardingStatus {
  const token = useAuthStore((s) => s.token);
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
    enabled: !!token && !currentProjectId,
    retry: 1,
  });

  useEffect(() => {
    const projects = data?.data ?? [];
    const first = projects[0];
    if (first && !currentProjectId) {
      setCurrentProject(first.id);
    }
  }, [data?.data, currentProjectId, setCurrentProject]);

  if (currentProjectId) return 'ready';
  if (isLoading) return 'loading';
  if (isError) return 'error';
  return 'needs-project';
}
