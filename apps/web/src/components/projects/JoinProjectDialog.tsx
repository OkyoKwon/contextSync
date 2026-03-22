import { useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { useJoinProject } from '../../hooks/use-join-project';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface JoinProjectDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function JoinProjectDialog({ isOpen, onClose }: JoinProjectDialogProps) {
  const [code, setCode] = useState('');
  const joinMutation = useJoinProject();
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);

  const handleJoin = () => {
    if (!code.trim()) return;
    joinMutation.mutate(code.trim(), {
      onSuccess: (response) => {
        if (response.data) {
          setCurrentProject(response.data.id);
        }
        setCode('');
        onClose();
      },
    });
  };

  const handleClose = () => {
    setCode('');
    joinMutation.reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Join Project">
      <div className="space-y-4">
        <Input
          label="Join Code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={8}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleJoin();
          }}
        />

        {joinMutation.isError && (
          <p className="text-sm text-red-400">
            {joinMutation.error instanceof Error
              ? joinMutation.error.message
              : 'Failed to join project. Please check the code and try again.'}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={joinMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={!code.trim() || joinMutation.isPending}>
            {joinMutation.isPending ? 'Joining...' : 'Join'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
