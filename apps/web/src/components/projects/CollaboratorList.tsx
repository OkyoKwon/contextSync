import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { useCollaborators } from '../../hooks/use-collaborators';
import { projectsApi } from '../../api/projects.api';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';

interface CollaboratorListProps {
  readonly projectId: string;
  readonly isOwner: boolean;
}

export function CollaboratorList({ projectId, isOwner }: CollaboratorListProps) {
  const { data, isLoading } = useCollaborators(projectId);
  const collaborators = data?.data ?? [];
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [email, setEmail] = useState('');

  const addMutation = useMutation({
    mutationFn: () => projectsApi.addCollaborator(projectId, { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', projectId] });
      setEmail('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => projectsApi.removeCollaborator(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', projectId] });
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold">Collaborators</h3>
      <div className="space-y-2">
        {collaborators.map((collab) => (
          <div key={collab.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-hover">
            <Avatar src={collab.userAvatarUrl} name={collab.userName ?? 'User'} />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{collab.userName}</p>
              <p className="text-xs text-text-tertiary">{collab.userEmail}</p>
            </div>
            <Badge>{collab.role}</Badge>
            {isOwner && collab.userId !== currentUserId && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => removeMutation.mutate(collab.userId)}
                disabled={removeMutation.isPending}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>
        ))}
        {collaborators.length === 0 && (
          <p className="text-sm text-text-tertiary">No collaborators yet.</p>
        )}
      </div>
      {isOwner && (
        <div className="mt-4 flex gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="collaborator@email.com"
            className="flex-1"
          />
          <Button
            onClick={() => addMutation.mutate()}
            disabled={!email || addMutation.isPending}
          >
            Add
          </Button>
        </div>
      )}
      {addMutation.isError && (
        <p className="mt-2 text-sm text-red-400">
          {addMutation.error instanceof Error
            ? addMutation.error.message
            : 'Failed to add collaborator'}
        </p>
      )}
    </Card>
  );
}
