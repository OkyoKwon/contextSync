import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { projectsApi } from '../../api/projects.api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DirectoryPicker } from './DirectoryPicker';

interface CreateProjectModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const navigate = useNavigate();
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [localDirectory, setLocalDirectory] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      projectsApi.create({
        name,
        repoUrl: repoUrl || undefined,
        localDirectory: localDirectory ?? undefined,
      }),
    onSuccess: (result) => {
      if (result.data) {
        setCurrentProject(result.data.id);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        setName('');
        setRepoUrl('');
        setLocalDirectory(null);
        onClose();
        navigate('/dashboard');
      }
    },
  });

  const handleClose = () => {
    if (!createMutation.isPending) {
      setName('');
      setRepoUrl('');
      setLocalDirectory(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Project">
      <div className="space-y-3">
        <Input
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Project"
        />
        <Input
          label="Repository URL (optional)"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/org/repo"
        />
        <DirectoryPicker value={localDirectory} onChange={setLocalDirectory} />
        {createMutation.isError && (
          <p className="text-sm text-red-400">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : 'Failed to create project'}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
