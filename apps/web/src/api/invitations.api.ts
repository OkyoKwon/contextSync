import type { Invitation, CreateInvitationInput } from '@context-sync/shared';
import { api } from './client';

export const invitationsApi = {
  createForProject: (projectId: string, input: CreateInvitationInput) =>
    api.post<Invitation>(`/projects/${projectId}/invitations`, input),

  listForProject: (projectId: string) =>
    api.get<readonly Invitation[]>(`/projects/${projectId}/invitations`),

  cancel: (invitationId: string) => api.delete<void>(`/invitations/${invitationId}`),

  listMine: () => api.get<readonly Invitation[]>('/invitations/mine'),

  respond: (token: string, action: 'accept' | 'decline') =>
    api.post<Invitation>('/invitations/respond', { token, action }),
};
