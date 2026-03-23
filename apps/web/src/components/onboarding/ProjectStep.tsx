import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ProjectStepProps {
  readonly onNext: (name: string) => void;
  readonly onSkip: () => void;
  readonly hasDirectories: boolean;
  readonly isPending: boolean;
}

export function ProjectStep({ onNext, onSkip, hasDirectories, isPending }: ProjectStepProps) {
  const [name, setName] = useState('');

  return (
    <div className="space-y-4">
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
