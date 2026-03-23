import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentProject } from '../../hooks/use-current-project';
import { usePermissions } from '../../hooks/use-permissions';
import { projectsApi } from '../../api/projects.api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';

interface GeneralTabProps {
  readonly projectId: string;
}

export function GeneralTab({ projectId }: GeneralTabProps) {
  return <ProjectInfoSection projectId={projectId} />;
}

function ProjectInfoSection({ projectId }: { readonly projectId: string }) {
  const { data: projectData, isLoading } = useCurrentProject();
  const { canEditProject } = usePermissions();
  const queryClient = useQueryClient();

  const project = projectData?.data ?? null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () =>
      projectsApi.update(projectId, {
        name: name || undefined,
        description: description || undefined,
        repoUrl: repoUrl || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setIsEditing(false);
    },
  });

  if (isLoading) return <Spinner />;
  if (!project) return null;

  const handleEdit = () => {
    setName(project.name);
    setDescription(project.description ?? '');
    setRepoUrl(project.repoUrl ?? '');
    setIsEditing(true);
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Info</h3>
        {!isEditing && canEditProject && (
          <Button size="sm" variant="secondary" onClick={handleEdit}>
            Edit
          </Button>
        )}
      </div>
      {isEditing ? (
        <div className="mt-4 space-y-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            label="Repository URL"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <InfoRow label="Name" value={project.name} />
          <InfoRow
            label="Description"
            value={project.description}
            emptyText="No description set"
            canEdit={canEditProject}
            onAdd={handleEdit}
          />
          <InfoRow
            label="Repository"
            value={project.repoUrl}
            emptyText="No repository linked"
            canEdit={canEditProject}
            onAdd={handleEdit}
          />
        </div>
      )}
    </Card>
  );
}

function InfoRow({
  label,
  value,
  emptyText,
  canEdit,
  onAdd,
}: {
  readonly label: string;
  readonly value?: string | null;
  readonly emptyText?: string;
  readonly canEdit?: boolean;
  readonly onAdd?: () => void;
}) {
  const isEmpty = !value;

  return (
    <div>
      <p className="text-xs font-medium text-text-tertiary">{label}</p>
      {isEmpty ? (
        <p className="text-sm italic text-text-tertiary">
          {emptyText ?? 'Not set'}
          {canEdit && onAdd && (
            <button onClick={onAdd} className="ml-2 text-blue-400 not-italic hover:text-blue-300">
              Add
            </button>
          )}
        </p>
      ) : (
        <p className="text-sm text-text-primary">{value}</p>
      )}
    </div>
  );
}
