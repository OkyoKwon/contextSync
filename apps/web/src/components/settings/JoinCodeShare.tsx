import { useState } from 'react';
import { Button } from '../ui/Button';

interface JoinCodeShareProps {
  readonly joinCode: string;
  readonly repoUrl?: string | null;
  readonly onRegenerate: () => void;
  readonly onDelete: () => void;
  readonly isRegenerating: boolean;
  readonly isDeleting: boolean;
}

function buildSetupGuide(joinCode: string, repoUrl?: string | null): string {
  const cloneUrl = repoUrl || '<your-repo-url>';
  return [
    'Join my ContextSync project:',
    '',
    '1. Clone the repo and install:',
    `   git clone ${cloneUrl} && cd contextSync && pnpm install`,
    '',
    '2. Run team setup:',
    '   pnpm setup:team',
    '',
    '3. Enter these when prompted:',
    '   Database URL: (ask project owner for the connection URL)',
    '   Your name: (your name)',
    `   Join Code: ${joinCode}`,
    '',
    '   A profile is auto-created from the project name.',
    '   Your existing .env stays untouched.',
    '',
    '4. Start the dev server:',
    '   pnpm dev:profile <project-name>',
  ].join('\n');
}

export function JoinCodeShare({
  joinCode,
  repoUrl,
  onRegenerate,
  onDelete,
  isRegenerating,
  isDeleting,
}: JoinCodeShareProps) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [guideCopied, setGuideCopied] = useState(false);

  const setupGuide = buildSetupGuide(joinCode, repoUrl);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(joinCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCopyGuide = async () => {
    await navigator.clipboard.writeText(setupGuide);
    setGuideCopied(true);
    setTimeout(() => setGuideCopied(false), 2000);
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

      {/* Setup guide */}
      <div className="rounded-lg border border-border-default bg-surface-hover/50 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
          Setup guide for team members
        </p>
        <pre className="whitespace-pre-wrap text-sm text-text-secondary">{setupGuide}</pre>
        <Button size="sm" variant="secondary" className="mt-3" onClick={handleCopyGuide}>
          {guideCopied ? 'Copied!' : 'Copy Setup Guide'}
        </Button>
      </div>

      {/* Database URL hint */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
        <p className="text-sm text-blue-300">
          Your DATABASE_URL is in{' '}
          <code className="rounded bg-blue-500/10 px-1 font-mono text-xs">apps/api/.env</code>{' '}
          &mdash; share it securely with team members.
        </p>
        <p className="mt-1 text-xs text-blue-400/70">
          Run{' '}
          <code className="rounded bg-blue-500/10 px-1 font-mono">
            grep DATABASE_URL apps/api/.env
          </code>{' '}
          in your terminal to view it.
        </p>
      </div>

      {/* Disable join code */}
      <Button size="sm" variant="danger" onClick={onDelete} disabled={isDeleting}>
        {isDeleting ? 'Disabling...' : 'Disable Join Code'}
      </Button>
    </div>
  );
}
