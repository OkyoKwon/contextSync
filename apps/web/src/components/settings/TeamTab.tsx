import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentProject } from '../../hooks/use-current-project';
import { usePermissions } from '../../hooks/use-permissions';
import { useCollaborators } from '../../hooks/use-collaborators';
import {
  useGenerateJoinCode,
  useRegenerateJoinCode,
  useDeleteJoinCode,
} from '../../hooks/use-join-project';
import { useAuthStore } from '../../stores/auth.store';
import { projectsApi } from '../../api/projects.api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';

interface TeamTabProps {
  readonly projectId: string;
}

export function TeamTab({ projectId }: TeamTabProps) {
  const { canManageCollaborators } = usePermissions();
  const { data: projectData } = useCurrentProject();
  const { data: collaboratorsData, isLoading: isCollabLoading } = useCollaborators(projectId);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  const project = projectData?.data ?? null;
  const joinCode = project?.joinCode ?? null;
  const collaborators = collaboratorsData?.data ?? [];

  const generateMutation = useGenerateJoinCode(projectId);
  const regenerateMutation = useRegenerateJoinCode(projectId);
  const deleteMutation = useDeleteJoinCode(projectId);

  const removeMutation = useMutation({
    mutationFn: (userId: string) => projectsApi.removeCollaborator(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!joinCode) return;
    await navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isCollabLoading) return <Spinner />;

  // Empty state when no collaborators and no join code
  if (!canManageCollaborators && collaborators.length === 0) {
    return (
      <Card>
        <div className="py-6 text-center">
          <svg
            className="mx-auto h-10 w-10 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <p className="mt-3 text-sm text-text-tertiary">No team members yet.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold">Team</h3>

      {/* Join Code section */}
      {canManageCollaborators && (
        <>
          {joinCode ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-text-tertiary">Join Code:</span>
                <code className="rounded-lg bg-surface-hover px-3 py-1.5 font-mono text-lg font-bold tracking-widest text-text-primary">
                  {joinCode}
                </code>
                <Button size="sm" variant="secondary" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => regenerateMutation.mutate()}
                  disabled={regenerateMutation.isPending}
                >
                  {regenerateMutation.isPending ? 'Regenerating...' : 'Regenerate'}
                </Button>
              </div>
              <p className="text-sm text-text-tertiary">
                Share this code with your team members. They also need the database URL to connect.
              </p>
              <Button
                size="sm"
                variant="danger"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Disabling...' : 'Disable Join Code'}
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-text-tertiary">
                {collaborators.length === 0
                  ? 'Invite your team. Generate a join code to get started.'
                  : 'Generate a join code to let more team members join this project.'}
              </p>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? 'Generating...' : 'Generate Join Code'}
              </Button>
            </div>
          )}

          {(generateMutation.isError || regenerateMutation.isError || deleteMutation.isError) && (
            <p className="mt-2 text-sm text-red-400">An error occurred. Please try again.</p>
          )}
        </>
      )}

      {/* Divider */}
      {canManageCollaborators && collaborators.length > 0 && (
        <div className="my-5 border-t border-border-default" />
      )}

      {/* Collaborator list */}
      {collaborators.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-text-secondary">Members</h4>
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
              {canManageCollaborators && collab.userId !== currentUserId && (
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
        </div>
      )}
    </Card>
  );
}
