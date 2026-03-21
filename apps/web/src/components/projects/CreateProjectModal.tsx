import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { projectsApi } from '../../api/projects.api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DirectoryPicker } from './DirectoryPicker';
import { showToast } from '../../lib/toast';

interface CreateProjectModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const navigate = useNavigate();
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [localDirectory, setLocalDirectory] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setName('');
    setLocalDirectory(null);
  }, []);

  const createMutation = useMutation({
    mutationFn: () =>
      projectsApi.create({
        name,
        localDirectory: localDirectory ?? undefined,
      }),
    onSuccess: (result) => {
      if (result.data) {
        setCurrentProject(result.data.id);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        showToast.success('Project created');
        resetState();
        onClose();
        navigate('/dashboard');
      }
    },
    onError: (error) => {
      showToast.error(error instanceof Error ? error.message : 'Failed to create project');
    },
  });

  const handleClose = useCallback(() => {
    if (createMutation.isPending) return;
    resetState();
    onClose();
  }, [createMutation.isPending, resetState, onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim()) {
        createMutation.mutate();
      }
    },
    [name, createMutation],
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Project"
          required
          error={name.length > 0 && !name.trim() ? 'Project name cannot be empty' : undefined}
        />

        <DirectoryPicker value={localDirectory} onChange={setLocalDirectory} defaultToActive />

        {createMutation.isError && (
          <p className="text-sm text-red-400">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : 'Failed to create project'}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending} disabled={!name.trim()}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
