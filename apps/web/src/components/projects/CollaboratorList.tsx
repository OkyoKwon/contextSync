import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { useCollaborators } from '../../hooks/use-collaborators';
import { useProjectInvitations, useCancelInvitation } from '../../hooks/use-invitations';
import { projectsApi } from '../../api/projects.api';
import { invitationsApi } from '../../api/invitations.api';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';

interface CollaboratorListProps {
  readonly projectId: string;
  readonly canManage: boolean;
}

export function CollaboratorList({ projectId, canManage }: CollaboratorListProps) {
  const { data, isLoading } = useCollaborators(projectId);
  const collaborators = data?.data ?? [];
  const { data: invitationsData } = useProjectInvitations(canManage ? projectId : null);
  const pendingInvitations = invitationsData?.data ?? [];
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [email, setEmail] = useState('');

  const inviteMutation = useMutation({
    mutationFn: () => invitationsApi.createForProject(projectId, { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEmail('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => projectsApi.removeCollaborator(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const cancelMutation = useCancelInvitation();

  if (isLoading) return <Spinner />;

  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold">Collaborators</h3>
      <div className="space-y-2">
        {collaborators.map((collab) => (
          <div
            key={collab.id}
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-hover"
          >
            <Avatar src={collab.userAvatarUrl} name={collab.userName ?? 'User'} />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{collab.userName}</p>
              <p className="text-xs text-text-tertiary">{collab.userEmail}</p>
            </div>
            <Badge>{collab.role}</Badge>
            {canManage && collab.userId !== currentUserId && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => removeMutation.mutate(collab.userId)}
                disabled={removeMutation.isPending}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            )}
          </div>
        ))}
        {collaborators.length === 0 && (
          <p className="text-sm text-text-tertiary">No collaborators yet.</p>
        )}
      </div>

      {canManage && pendingInvitations.length > 0 && (
        <div className="mt-4 border-t border-border-default pt-4">
          <h4 className="mb-2 text-sm font-semibold text-text-secondary">Pending Invitations</h4>
          <div className="space-y-2">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 rounded-lg bg-surface-hover/50 p-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text-primary">{inv.email}</p>
                  <p className="text-xs text-text-tertiary">
                    Expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="info">{inv.role}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => cancelMutation.mutate(inv.id)}
                  disabled={cancelMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {canManage && (
        <div className="mt-4 flex gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="collaborator@email.com"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && email) inviteMutation.mutate();
            }}
          />
          <Button
            onClick={() => inviteMutation.mutate()}
            disabled={!email || inviteMutation.isPending}
          >
            Invite
          </Button>
        </div>
      )}
      {inviteMutation.isError && (
        <p className="mt-2 text-sm text-red-400">
          {inviteMutation.error instanceof Error
            ? inviteMutation.error.message
            : 'Failed to send invitation'}
        </p>
      )}
    </Card>
  );
}
