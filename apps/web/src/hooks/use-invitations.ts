import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApi } from '../api/invitations.api';

export function useMyInvitations() {
  return useQuery({
    queryKey: ['invitations', 'mine'],
    queryFn: () => invitationsApi.listMine(),
  });
}

export function useProjectInvitations(projectId: string | null) {
  return useQuery({
    queryKey: ['invitations', 'project', projectId],
    queryFn: () => invitationsApi.listForProject(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateInvitation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role?: string }) =>
      invitationsApi.createForProject(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useRespondInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, action }: { token: string; action: 'accept' | 'decline' }) =>
      invitationsApi.respond(token, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['collaborators'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => invitationsApi.cancel(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}
