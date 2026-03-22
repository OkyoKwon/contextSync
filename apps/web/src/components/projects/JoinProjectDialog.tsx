import { useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { useJoinProject } from '../../hooks/use-join-project';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

function SetupChecklist() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border-default">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover"
      >
        <span>Setup checklist</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <ul className="space-y-2 border-t border-border-default px-3 py-2 text-sm text-text-tertiary">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0">1.</span>
            <span>Ensure your API server is connected to the team&apos;s remote database</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0">2.</span>
            <span>Ask the project owner for the connection URL if needed</span>
          </li>
        </ul>
      )}
    </div>
  );
}

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
        <p className="text-sm text-text-tertiary">
          Enter the join code shared by your project owner.
        </p>
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

        <SetupChecklist />

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
