import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth.store';
import { useCurrentProject } from '../hooks/use-current-project';
import { projectsApi } from '../api/projects.api';
import { CollaboratorList } from '../components/projects/CollaboratorList';
import { PageBreadcrumb } from '../components/layout/PageBreadcrumb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';

export function SettingsPage() {
  const currentProjectId = useAuthStore((s) => s.currentProjectId);

  if (!currentProjectId || currentProjectId === 'skipped') {
    return (
      <div>
        <div className="mb-6">
          <PageBreadcrumb pageName="Settings" />
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-semibold text-text-primary">No project selected</p>
          <p className="mt-2 text-sm text-text-tertiary">
            Select or create a project to manage its settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <PageBreadcrumb pageName="Settings" />
      </div>
      <div className="space-y-6">
        <ProjectInfoSection projectId={currentProjectId} />
        <CollaboratorSection projectId={currentProjectId} />
        <DangerZoneSection projectId={currentProjectId} />
      </div>
    </div>
  );
}

function ProjectInfoSection({ projectId }: { readonly projectId: string }) {
  const { data: projectData, isLoading } = useCurrentProject();
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
    <>
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Project Info</h3>
          {!isEditing && (
            <Button size="sm" variant="secondary" onClick={handleEdit}>
              Edit
            </Button>
          )}
        </div>
        {isEditing ? (
          <div className="mt-4 space-y-3">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Input label="Repository URL" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
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
            <InfoRow label="Description" value={project.description ?? 'None'} />
            <InfoRow label="Repository" value={project.repoUrl ?? 'None'} />
          </div>
        )}
      </Card>
    </>
  );
}

function InfoRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-tertiary">{label}</p>
      <p className="text-sm text-text-primary">{value}</p>
    </div>
  );
}

function CollaboratorSection({ projectId }: { readonly projectId: string }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: projectData } = useCurrentProject();
  const project = projectData?.data ?? null;

  const isOwner = project?.ownerId === currentUserId;

  return <CollaboratorList projectId={projectId} isOwner={isOwner} />;
}

function DangerZoneSection({ projectId }: { readonly projectId: string }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: projectData } = useCurrentProject();
  const project = projectData?.data ?? null;
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);
  const queryClient = useQueryClient();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.delete(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCurrentProject(null);
      setShowDeleteModal(false);
    },
  });

  const isOwner = project?.ownerId === currentUserId;
  if (!isOwner) return null;

  return (
    <>
      <Card className="border-red-500/30">
        <h3 className="text-lg font-semibold text-red-400">Delete Project</h3>
        <p className="mt-2 text-sm text-text-tertiary">
          Deleting this project will permanently remove all sessions, messages, and conflict records.
        </p>
        <Button
          variant="danger"
          className="mt-4"
          onClick={() => setShowDeleteModal(true)}
        >
          Delete {project?.name} Project
        </Button>
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
      >
        <p className="mb-2 text-sm text-text-secondary">
          Are you sure you want to delete <strong className="text-text-primary">{project?.name}</strong>?
        </p>
        <p className="mb-6 text-sm text-red-400">
          All linked sessions, messages, conflict records, and sync history will be permanently deleted.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
