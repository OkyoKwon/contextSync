import { useState } from 'react';
import { Button } from '../ui/Button';

interface JoinCodeShareProps {
  readonly joinCode: string;
  readonly onRegenerate: () => void;
  readonly onDelete: () => void;
  readonly isRegenerating: boolean;
  readonly isDeleting: boolean;
}

export function JoinCodeShare({
  joinCode,
  onRegenerate,
  onDelete,
  isRegenerating,
  isDeleting,
}: JoinCodeShareProps) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [instructionsCopied, setInstructionsCopied] = useState(false);

  const instructions = [
    `Join my ContextSync project:`,
    `1. Sign up / log in`,
    `2. Click "Join Project" in the sidebar`,
    `3. Enter code: ${joinCode}`,
  ].join('\n');

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(joinCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCopyInstructions = async () => {
    await navigator.clipboard.writeText(instructions);
    setInstructionsCopied(true);
    setTimeout(() => setInstructionsCopied(false), 2000);
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Join code display */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-text-tertiary">Join Code:</span>
        <code className="rounded-lg bg-surface-hover px-3 py-1.5 font-mono text-lg font-bold tracking-widest text-text-primary">
          {joinCode}
        </code>
        <Button size="sm" variant="secondary" onClick={handleCopyCode}>
          {codeCopied ? 'Copied!' : 'Copy Code'}
        </Button>
        <Button size="sm" variant="secondary" onClick={onRegenerate} disabled={isRegenerating}>
          {isRegenerating ? 'Regenerating...' : 'Regenerate'}
        </Button>
      </div>

      {/* Share instructions */}
      <div className="rounded-lg border border-border-default bg-surface-hover/50 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
          Share with your team
        </p>
        <pre className="whitespace-pre-wrap text-sm text-text-secondary">{instructions}</pre>
        <Button size="sm" variant="secondary" className="mt-3" onClick={handleCopyInstructions}>
          {instructionsCopied ? 'Copied!' : 'Copy Instructions'}
        </Button>
      </div>

      {/* Database note */}
      <p className="text-sm text-text-tertiary">
        Team members need their API server connected to the same remote database. Share the
        connection URL separately via a secure channel.
      </p>

      {/* Disable join code */}
      <Button size="sm" variant="danger" onClick={onDelete} disabled={isDeleting}>
        {isDeleting ? 'Disabling...' : 'Disable Join Code'}
      </Button>
    </div>
  );
}
