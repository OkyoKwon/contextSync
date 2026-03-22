import { useState } from 'react';
import { useCurrentProject } from '../../hooks/use-current-project';
import { usePermissions } from '../../hooks/use-permissions';
import {
  useGenerateJoinCode,
  useRegenerateJoinCode,
  useDeleteJoinCode,
} from '../../hooks/use-join-project';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface CollaborationSectionProps {
  readonly projectId: string;
}

export function CollaborationSection({ projectId }: CollaborationSectionProps) {
  const { data: projectData } = useCurrentProject();
  const { canManageCollaborators } = usePermissions();
  const project = projectData?.data ?? null;
  const joinCode = project?.joinCode ?? null;

  const generateMutation = useGenerateJoinCode(projectId);
  const regenerateMutation = useRegenerateJoinCode(projectId);
  const deleteMutation = useDeleteJoinCode(projectId);

  const [copied, setCopied] = useState(false);

  if (!canManageCollaborators) return null;

  const handleCopy = async () => {
    if (!joinCode) return;
    await navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold">Collaboration</h3>

      {joinCode ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
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
            Generate a join code to let team members join this project.
          </p>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? 'Generating...' : 'Generate Join Code'}
          </Button>
        </div>
      )}

      {(generateMutation.isError || regenerateMutation.isError || deleteMutation.isError) && (
        <p className="mt-2 text-sm text-red-400">An error occurred. Please try again.</p>
      )}
    </Card>
  );
}
