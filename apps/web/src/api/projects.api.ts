import type { Project, CreateProjectInput, CreatePersonalProjectInput, UpdateProjectInput } from '@context-sync/shared';
import { api } from './client';

export const projectsApi = {
  listByTeam: (teamId: string) => api.get<readonly Project[]>(`/teams/${teamId}/projects`),
  listPersonal: () => api.get<readonly Project[]>('/projects/personal'),
  get: (projectId: string) => api.get<Project>(`/projects/${projectId}`),
  create: (teamId: string, input: CreateProjectInput) =>
    api.post<Project>(`/teams/${teamId}/projects`, input),
  createPersonal: (input: CreatePersonalProjectInput) =>
    api.post<Project>('/projects/personal', input),
  update: (projectId: string, input: UpdateProjectInput) =>
    api.patch<Project>(`/projects/${projectId}`, input),
  delete: (projectId: string) => api.delete<void>(`/projects/${projectId}`),
};
