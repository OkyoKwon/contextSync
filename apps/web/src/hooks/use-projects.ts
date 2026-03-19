import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.api';
import { useAuthStore } from '../stores/auth.store';

export function useProjects() {
  const teamId = useAuthStore((s) => s.currentTeamId);

  return useQuery({
    queryKey: ['projects', teamId],
    queryFn: () => projectsApi.listByTeam(teamId!),
    enabled: !!teamId,
  });
}
