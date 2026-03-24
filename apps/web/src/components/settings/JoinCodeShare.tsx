import { useState } from 'react';
import { Button } from '../ui/Button';

interface JoinCodeShareProps {
  readonly joinCode: string;
  readonly projectName: string;
  readonly repoUrl?: string | null;
  readonly onRegenerate: () => void;
  readonly onDelete: () => void;
  readonly isRegenerating: boolean;
  readonly isDeleting: boolean;
}

function toProfileName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

function extractDirName(repoUrl: string): string {
  const cleaned = repoUrl.replace(/\/+$/, '').replace(/\.git$/, '');
  const lastSegment = cleaned.split('/').pop();
  return lastSegment || 'contextSync';
}

function buildSetupGuide(joinCode: string, projectName: string, repoUrl?: string | null): string {
  const dirName = repoUrl ? extractDirName(repoUrl) : 'contextSync';
  const profileName = toProfileName(projectName);

  const cloneStep = repoUrl
    ? `   git clone ${repoUrl} && cd ${dirName} && pnpm install`
    : `   Clone the ContextSync repo, then:\n   cd ${dirName} && pnpm install`;

  return [
    `Join "${projectName}" on ContextSync`,
    '',
    'Prerequisites: Node.js 22+, pnpm, Docker',
    '',
    '1. Set up ContextSync:',
    cloneStep,
    '',
    '2. Run team setup:',
    '   pnpm setup:team',
    '',
    '3. Enter when prompted:',
    '   - Database URL: (provided by project owner)',
    '   - Your name: (your name)',
    `   - Join Code: ${joinCode}`,
    '',
    '   A profile is auto-created from the project name.',
    '   Your existing .env stays untouched.',
    '',
    '4. Start the dev server:',
    `   pnpm dev:profile ${profileName}`,
  ].join('\n');
}

export function JoinCodeShare({
  joinCode,
  projectName,
  repoUrl,
  onRegenerate,
  onDelete,
  isRegenerating,
  isDeleting,
}: JoinCodeShareProps) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [guideCopied, setGuideCopied] = useState(false);

  const setupGuide = buildSetupGuide(joinCode, projectName, repoUrl);

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

      {/* Owner hint — DATABASE_URL sharing */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          For project owner
        </p>
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
      </div>

      {/* Setup guide — shareable with team members */}
      <div className="rounded-lg border border-border-default bg-surface-hover/50 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
          Share with team members
        </p>
        <pre className="whitespace-pre-wrap text-sm text-text-secondary">{setupGuide}</pre>
        <Button size="sm" variant="secondary" className="mt-3" onClick={handleCopyGuide}>
          {guideCopied ? 'Copied!' : 'Copy Setup Guide'}
        </Button>
      </div>

      {/* Disable join code */}
      <Button size="sm" variant="danger" onClick={onDelete} disabled={isDeleting}>
        {isDeleting ? 'Disabling...' : 'Disable Join Code'}
      </Button>
    </div>
  );
}
