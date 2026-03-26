import { useState, useRef, useEffect } from 'react';
import { useSession, useUpdateSession } from '../../hooks/use-sessions';
import { Spinner } from '../ui/Spinner';
import { Badge } from '../ui/Badge';
import { MessageThread } from '../sessions/MessageThread';
import { showToast } from '../../lib/toast';

interface RemoteSessionConversationProps {
  readonly sessionId: string;
}

export function RemoteSessionConversation({ sessionId }: RemoteSessionConversationProps) {
  const { data, isLoading, error } = useSession(sessionId);
  const updateMutation = useUpdateSession();
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = editingSessionId === sessionId;

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

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

  const startEdit = () => {
    setEditValue(session.title);
    setEditingSessionId(sessionId);
  };

  const cancelEdit = () => {
    setEditingSessionId(null);
  };

  const saveTitle = () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === session.title) {
      cancelEdit();
      return;
    }
    updateMutation.mutate(
      { sessionId, title: trimmed },
      {
        onSuccess: () => {
          setEditingSessionId(null);
          showToast.success('Title updated');
        },
        onError: (err) => showToast.error(err instanceof Error ? err.message : 'Failed to update'),
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border-default p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={saveTitle}
                  maxLength={500}
                  disabled={updateMutation.isPending}
                  className="flex-1 rounded-md border border-border-input bg-bg-secondary px-2 py-1 text-lg font-semibold text-text-primary outline-none focus:border-blue-500"
                />
              ) : (
                <h2
                  className="group flex cursor-pointer items-center gap-1.5 truncate text-lg font-semibold text-text-primary"
                  onClick={startEdit}
                  title="Click to edit title"
                >
                  {session.title}
                  <svg
                    className="h-3.5 w-3.5 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                    />
                  </svg>
                </h2>
              )}
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
