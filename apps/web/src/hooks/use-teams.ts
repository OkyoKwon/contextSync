import { useQuery } from '@tanstack/react-query';
import { teamsApi } from '../api/teams.api';
import { useAuthStore } from '../stores/auth.store';

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.list(),
  });
}

export function useTeamMembers() {
  const teamId = useAuthStore((s) => s.currentTeamId);

  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => teamsApi.getMembers(teamId!),
    enabled: !!teamId,
  });
}
