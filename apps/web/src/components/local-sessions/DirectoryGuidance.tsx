import { useQuery } from '@tanstack/react-query';
import { sessionsApi } from '../../api/sessions.api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface DirectoryGuidanceProps {
  readonly onOpenDirectoryModal: () => void;
}

export function DirectoryGuidance({ onOpenDirectoryModal }: DirectoryGuidanceProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['local-directories'],
    queryFn: () => sessionsApi.listLocalDirectories(),
  });

  const directories = data?.data ?? [];

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Step 1: Explanation */}
        <div className="text-center">
          <svg
            className="mx-auto mb-3 h-12 w-12 text-text-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
          </svg>
          <h2 className="text-lg font-semibold text-text-primary">Link your working directory</h2>
          <p className="mt-2 text-sm text-text-tertiary">
            Claude Code (CLI) stores session data in{' '}
            <code className="font-mono text-text-secondary">~/.claude/projects/</code>. Link your
            project directory to automatically discover and sync sessions.
          </p>
          <p className="mt-2 text-xs text-text-muted">
            Using another AI tool? You can upload session files directly via the Import button.
          </p>
        </div>

        {/* Step 2: Detected directories */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner size="sm" />
            <span className="ml-2 text-sm text-text-tertiary">Scanning for directories...</span>
          </div>
        ) : directories.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Detected directories
            </p>
            <div className="space-y-1.5">
              {directories.slice(0, 5).map((dir) => (
                <button
                  key={dir.path}
                  type="button"
                  onClick={onOpenDirectoryModal}
                  className="flex w-full items-center gap-3 rounded-lg border border-border-default bg-surface px-4 py-3 text-left transition-colors hover:border-blue-500/50 hover:bg-surface-hover"
                >
                  <svg
                    className="h-4 w-4 flex-shrink-0 text-blue-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {dir.path.replace(/^\/Users\/[^/]+/, '~')}
                    </p>
                    <p className="text-xs text-text-muted">
                      {dir.sessionCount} session{dir.sessionCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {dir.isActive && <Badge variant="success">Active</Badge>}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Step 3: Manual CTA */}
        <div className="flex justify-center">
          <Button onClick={onOpenDirectoryModal}>
            {directories.length > 0 ? 'Choose Directory' : 'Link My Directory'}
          </Button>
        </div>
      </div>
    </div>
  );
}
