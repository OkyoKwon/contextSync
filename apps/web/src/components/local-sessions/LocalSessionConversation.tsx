import type { LocalSessionDetail } from '@context-sync/shared';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { MessageThread } from '../sessions/MessageThread';
import { useLocalSessionDetail } from '../../hooks/use-local-session-detail';

interface LocalSessionConversationProps {
  readonly sessionId: string | null;
  readonly isSynced: boolean;
  readonly isSyncing: boolean;
  readonly onSync: (sessionId: string) => void;
}

export function LocalSessionConversation({
  sessionId,
  isSynced,
  isSyncing,
  onSync,
}: LocalSessionConversationProps) {
  const { data, isLoading, error } = useLocalSessionDetail(sessionId);

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-text-muted">Select a session to view its conversation.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="md" />
        <span className="ml-2 text-sm text-text-tertiary">Loading conversation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : 'Failed to load session'}
        </p>
      </div>
    );
  }

  const detail: LocalSessionDetail | null | undefined = data?.data;
  if (!detail) return null;

  return (
    <div className="flex h-full flex-col">
      <SessionHeader detail={detail} isSynced={isSynced} isSyncing={isSyncing} onSync={onSync} />
      <div className="flex-1 overflow-y-auto p-4">
        <MessageThread messages={detail.messages} />
      </div>
    </div>
  );
}

function SessionHeader({
  detail,
  isSynced,
  isSyncing,
  onSync,
}: {
  readonly detail: LocalSessionDetail;
  readonly isSynced: boolean;
  readonly isSyncing: boolean;
  readonly onSync: (sessionId: string) => void;
}) {
  return (
    <div className="border-b border-border-default p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-text-primary">{detail.title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {detail.branch && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-medium text-purple-400">
                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z" />
                </svg>
                {detail.branch}
              </span>
            )}
            {detail.filePaths.slice(0, 5).map((fp) => (
              <span
                key={fp}
                className="inline-block rounded bg-surface-hover px-1.5 py-0.5 font-mono text-xs text-text-tertiary"
                title={fp}
              >
                {fp.split('/').pop()}
              </span>
            ))}
            {detail.filePaths.length > 5 && (
              <span className="text-xs text-text-muted">+{detail.filePaths.length - 5} more</span>
            )}
          </div>
        </div>
        {!isSynced && (
          <Button variant="primary" onClick={() => onSync(detail.sessionId)} disabled={isSyncing}>
            {isSyncing ? <Spinner size="sm" /> : 'Sync this session'}
          </Button>
        )}
      </div>
    </div>
  );
}
