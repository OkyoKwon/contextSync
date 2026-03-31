import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ProjectStepProps {
  readonly onNext: (name: string) => void;
  readonly onSkip: () => void;
  readonly onSwitchUser?: () => void;
  readonly hasDirectories: boolean;
  readonly isPending: boolean;
  readonly userName?: string;
}

export function ProjectStep({
  onNext,
  onSkip,
  onSwitchUser,
  hasDirectories,
  isPending,
  userName,
}: ProjectStepProps) {
  const [name, setName] = useState('');

  return (
    <div className="space-y-4">
      {userName && (
        <div className="flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2">
          <span className="text-sm text-text-secondary">
            Signed in as <span className="font-medium text-text-primary">{userName}</span>
          </span>
          {onSwitchUser && (
            <button
              type="button"
              onClick={onSwitchUser}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Switch user
            </button>
          )}
        </div>
      )}
      <Input
        label="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="My Project"
      />
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-text-tertiary underline hover:text-text-secondary"
        >
          Skip for now
        </button>
        <Button onClick={() => onNext(name)} disabled={!name || isPending}>
          {hasDirectories ? 'Next' : 'Create Project'}
        </Button>
      </div>
    </div>
  );
}
