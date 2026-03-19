import type { Team, TeamMember, CreateTeamInput } from '@context-sync/shared';
import { api } from './client';

export const teamsApi = {
  list: () => api.get<readonly Team[]>('/teams'),
  get: (teamId: string) => api.get<Team>(`/teams/${teamId}`),
  create: (input: CreateTeamInput) => api.post<Team>('/teams', input),
  update: (teamId: string, input: Partial<CreateTeamInput>) => api.patch<Team>(`/teams/${teamId}`, input),
  getMembers: (teamId: string) => api.get<readonly TeamMember[]>(`/teams/${teamId}/members`),
  addMember: (teamId: string, userId: string, role?: string) =>
    api.post(`/teams/${teamId}/members`, { userId, role }),
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/teams/${teamId}/members/${userId}`),
};
