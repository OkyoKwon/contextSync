import type { Project, CreateProjectInput, UpdateProjectInput } from '@context-sync/shared';
import { api } from './client';

export const projectsApi = {
  listByTeam: (teamId: string) => api.get<readonly Project[]>(`/teams/${teamId}/projects`),
  get: (projectId: string) => api.get<Project>(`/projects/${projectId}`),
  create: (teamId: string, input: CreateProjectInput) =>
    api.post<Project>(`/teams/${teamId}/projects`, input),
  update: (projectId: string, input: UpdateProjectInput) =>
    api.patch<Project>(`/projects/${projectId}`, input),
};
