import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentProject } from '../../hooks/use-current-project';
import { usePermissions } from '../../hooks/use-permissions';
import { useAuthStore } from '../../stores/auth.store';
import { projectsApi } from '../../api/projects.api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface DangerZoneTabProps {
  readonly projectId: string;
}

export function DangerZoneTab({ projectId }: DangerZoneTabProps) {
  const { canDeleteProject } = usePermissions();
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

  if (!canDeleteProject) {
    return (
      <Card>
        <p className="text-sm text-text-tertiary">
          You don't have permission to perform destructive actions on this project.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-red-500/30">
        <h3 className="text-lg font-semibold text-red-400">Delete Project</h3>
        <p className="mt-2 text-sm text-text-tertiary">
          Deleting this project will permanently remove all sessions, messages, and conflict
          records.
        </p>
        <Button variant="danger" className="mt-4" onClick={() => setShowDeleteModal(true)}>
          Delete {project?.name} Project
        </Button>
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
      >
        <p className="mb-2 text-sm text-text-secondary">
          Are you sure you want to delete{' '}
          <strong className="text-text-primary">{project?.name}</strong>?
        </p>
        <p className="mb-6 text-sm text-red-400">
          All linked sessions, messages, conflict records, and sync history will be permanently
          deleted.
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
