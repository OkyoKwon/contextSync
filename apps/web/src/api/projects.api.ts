import type {
  Project,
  ProjectWithTeamInfo,
  Collaborator,
  CreateProjectInput,
  UpdateProjectInput,
  AddCollaboratorInput,
} from '@context-sync/shared';
import { api } from './client';

export const projectsApi = {
  list: () => api.get<readonly ProjectWithTeamInfo[]>('/projects'),
  get: (projectId: string) => api.get<ProjectWithTeamInfo>(`/projects/${projectId}`),
  create: (input: CreateProjectInput) => api.post<Project>('/projects', input),
  update: (projectId: string, input: UpdateProjectInput) =>
    api.patch<Project>(`/projects/${projectId}`, input),
  delete: (projectId: string) => api.delete<void>(`/projects/${projectId}`),
  listCollaborators: (projectId: string) =>
    api.get<readonly Collaborator[]>(`/projects/${projectId}/collaborators`),
  addCollaborator: (projectId: string, input: AddCollaboratorInput) =>
    api.post<void>(`/projects/${projectId}/collaborators`, input),
  removeCollaborator: (projectId: string, userId: string) =>
    api.delete<void>(`/projects/${projectId}/collaborators/${userId}`),
  setMyDirectory: (projectId: string, localDirectory: string | null) =>
    api.patch<void>(`/projects/${projectId}/my-directory`, { localDirectory }),
};
