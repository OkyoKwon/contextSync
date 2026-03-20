import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { DirectoryPicker } from './DirectoryPicker';
import { projectsApi } from '../../api/projects.api';

interface ChangeDirectoryModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly projectId: string;
  readonly currentDirectory: string | null;
}

export function ChangeDirectoryModal({
  isOpen,
  onClose,
  projectId,
  currentDirectory,
}: ChangeDirectoryModalProps) {
  const [selected, setSelected] = useState<string | null>(currentDirectory);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (localDirectory: string | null) =>
      projectsApi.update(projectId, { localDirectory }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleSave = useCallback(async () => {
    if (selected === currentDirectory) {
      onClose();
      return;
    }
    await mutation.mutateAsync(selected);
    onClose();
  }, [selected, currentDirectory, mutation, onClose]);

  const handleClose = useCallback(() => {
    setSelected(currentDirectory);
    mutation.reset();
    onClose();
  }, [currentDirectory, mutation, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Linked Directory">
      <DirectoryPicker value={selected} onChange={setSelected} />

      {mutation.error && (
        <p className="mt-3 text-sm text-red-400">
          {mutation.error instanceof Error ? mutation.error.message : 'Failed to update directory'}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? <Spinner size="sm" /> : 'Save'}
        </Button>
      </div>
    </Modal>
  );
}
