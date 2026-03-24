import { useSession } from '../../hooks/use-sessions';
import { Spinner } from '../ui/Spinner';
import { Badge } from '../ui/Badge';
import { MessageThread } from '../sessions/MessageThread';

interface RemoteSessionConversationProps {
  readonly sessionId: string;
}

export function RemoteSessionConversation({ sessionId }: RemoteSessionConversationProps) {
  const { data, isLoading, error } = useSession(sessionId);

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

  const session = data?.data;
  if (!session) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border-default p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-text-primary">{session.title}</h2>
              <Badge variant="default">Team</Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {session.userName && (
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-medium text-blue-400">
                    {session.userName.charAt(0).toUpperCase()}
                  </span>
                  {session.userName}
                </span>
              )}
              {'filePaths' in session &&
                (session.filePaths as readonly string[]).slice(0, 5).map((fp) => (
                  <span
                    key={fp}
                    className="inline-block rounded bg-surface-hover px-1.5 py-0.5 font-mono text-xs text-text-tertiary"
                    title={fp}
                  >
                    {fp.split('/').pop()}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {'messages' in session && (
          <MessageThread
            messages={
              session.messages as readonly {
                role: 'user' | 'assistant';
                content: string;
                modelUsed?: string | null;
              }[]
            }
          />
        )}
      </div>
    </div>
  );
}
