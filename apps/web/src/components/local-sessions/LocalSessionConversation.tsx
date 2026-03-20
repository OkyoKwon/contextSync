import type { LocalSessionDetail } from '@context-sync/shared';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { MessageThread } from '../sessions/MessageThread';
import { useLocalSessionDetail } from '../../hooks/use-local-session-detail';

interface LocalSessionConversationProps {
  readonly sessionId: string | null;
  readonly isSyncing: boolean;
  readonly onSync: (sessionId: string) => void;
}

export function LocalSessionConversation({
  sessionId,
  isSyncing,
  onSync,
}: LocalSessionConversationProps) {
  const { data, isLoading, error } = useLocalSessionDetail(sessionId);

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-400">Select a session to view its conversation.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="md" />
        <span className="ml-2 text-sm text-gray-500">Loading conversation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to load session'}
        </p>
      </div>
    );
  }

  const detail: LocalSessionDetail | null | undefined = data?.data;
  if (!detail) return null;

  return (
    <div className="flex h-full flex-col">
      <SessionHeader detail={detail} isSyncing={isSyncing} onSync={onSync} />
      <div className="flex-1 overflow-y-auto p-4">
        <MessageThread messages={detail.messages} />
      </div>
    </div>
  );
}

function SessionHeader({
  detail,
  isSyncing,
  onSync,
}: {
  readonly detail: LocalSessionDetail;
  readonly isSyncing: boolean;
  readonly onSync: (sessionId: string) => void;
}) {
  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-gray-900">{detail.title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {detail.branch && (
              <Badge variant="default">{detail.branch}</Badge>
            )}
            {detail.filePaths.slice(0, 5).map((fp) => (
              <span
                key={fp}
                className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                title={fp}
              >
                {fp.split('/').pop()}
              </span>
            ))}
            {detail.filePaths.length > 5 && (
              <span className="text-xs text-gray-400">+{detail.filePaths.length - 5} more</span>
            )}
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => onSync(detail.sessionId)}
          disabled={isSyncing}
        >
          {isSyncing ? <Spinner size="sm" /> : 'Sync this session'}
        </Button>
      </div>
    </div>
  );
}
