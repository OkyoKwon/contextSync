import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { useJoinProject } from '../../hooks/use-join-project';
import { projectsApi } from '../../api/projects.api';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { DirectoryPicker } from './DirectoryPicker';

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
            <span>Node.js 22+, pnpm, and Docker are installed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0">2.</span>
            <span>You have the DATABASE_URL from the project owner</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0">3.</span>
            <span>
              Team setup is complete (
              <code className="rounded bg-surface-hover px-1 font-mono text-xs">
                pnpm setup:team
              </code>
              )
            </span>
          </li>
        </ul>
      )}
    </div>
  );
}

type Step = 'join' | 'directory';

interface JoinProjectDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function JoinProjectDialog({ isOpen, onClose }: JoinProjectDialogProps) {
  const [step, setStep] = useState<Step>('join');
  const [code, setCode] = useState('');
  const [joinedProjectId, setJoinedProjectId] = useState<string | null>(null);
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);

  const joinMutation = useJoinProject();
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);
  const queryClient = useQueryClient();

  const directoryMutation = useMutation({
    mutationFn: (localDirectory: string | null) =>
      projectsApi.setMyDirectory(joinedProjectId!, localDirectory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleJoin = () => {
    if (!code.trim()) return;
    joinMutation.mutate(code.trim(), {
      onSuccess: (response) => {
        if (response.data) {
          setCurrentProject(response.data.id);
          setJoinedProjectId(response.data.id);
        }
        setStep('directory');
      },
    });
  };

  const handleReset = useCallback(() => {
    setStep('join');
    setCode('');
    setJoinedProjectId(null);
    setSelectedDirectory(null);
    joinMutation.reset();
    directoryMutation.reset();
    onClose();
  }, [onClose, joinMutation, directoryMutation]);

  const handleSaveDirectory = useCallback(async () => {
    if (!selectedDirectory || !joinedProjectId) return;
    await directoryMutation.mutateAsync(selectedDirectory);
    handleReset();
  }, [selectedDirectory, joinedProjectId, directoryMutation, handleReset]);

  const handleSkipDirectory = useCallback(() => {
    handleReset();
  }, [handleReset]);

  const title = step === 'join' ? 'Join Project' : 'Link Your Directory';

  return (
    <Modal isOpen={isOpen} onClose={handleReset} title={title}>
      {step === 'join' && (
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
            <Button variant="secondary" onClick={handleReset} disabled={joinMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleJoin} disabled={!code.trim() || joinMutation.isPending}>
              {joinMutation.isPending ? 'Joining...' : 'Join'}
            </Button>
          </div>
        </div>
      )}

      {step === 'directory' && (
        <div className="space-y-4">
          <p className="text-sm text-text-tertiary">
            Select the local directory where you work on this project. Your Claude Code sessions
            from this directory will be automatically synced.
          </p>

          <DirectoryPicker value={selectedDirectory} onChange={setSelectedDirectory} />

          {directoryMutation.isError && (
            <p className="text-sm text-red-400">
              {directoryMutation.error instanceof Error
                ? directoryMutation.error.message
                : 'Failed to link directory'}
            </p>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSkipDirectory}
              className="text-sm text-text-muted hover:text-text-secondary"
            >
              Skip for now
            </button>
            <Button
              onClick={handleSaveDirectory}
              disabled={!selectedDirectory || directoryMutation.isPending}
            >
              {directoryMutation.isPending ? <Spinner size="sm" /> : 'Save & Continue'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
