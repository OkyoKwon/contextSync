import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.api';

export function useCollaborators(projectId: string | null) {
  return useQuery({
    queryKey: ['collaborators', projectId],
    queryFn: () => projectsApi.listCollaborators(projectId!),
    enabled: !!projectId && projectId !== 'skipped',
  });
}
