import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.api';
import { useAuthStore } from '../stores/auth.store';

export function useCurrentProject() {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId && projectId !== 'skipped',
  });
}
