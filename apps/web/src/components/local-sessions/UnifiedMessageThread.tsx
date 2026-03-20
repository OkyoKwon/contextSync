import type { UnifiedMessage } from '@context-sync/shared';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useThemeStore } from '../../stores/theme.store';

interface UnifiedMessageThreadProps {
  readonly messages: readonly UnifiedMessage[];
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly onLoadMore: () => void;
  readonly onSelectSession: (sessionId: string) => void;
}

export function UnifiedMessageThread({
  messages,
  hasMore,
  isLoading,
  onLoadMore,
  onSelectSession,
}: UnifiedMessageThreadProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showSessionDivider = prevMessage && prevMessage.sessionId !== message.sessionId;
        const showDateDivider = prevMessage && isDayGap(prevMessage.timestamp, message.timestamp);

        return (
          <div key={`${message.sessionId}-${message.timestamp}-${index}`}>
            {showDateDivider && !showSessionDivider && (
              <DateDivider timestamp={message.timestamp} />
            )}
            {showSessionDivider && (
              <SessionDivider
                sessionTitle={message.sessionTitle}
                sessionId={message.sessionId}
                timestamp={message.timestamp}
                onSelectSession={onSelectSession}
              />
            )}
            <UnifiedMessageBubble message={message} />
          </div>
        );
      })}

      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="rounded-lg border border-border-input px-4 py-2 text-sm text-text-tertiary hover:bg-surface-hover disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}

function SessionDivider({
  sessionTitle,
  sessionId,
  timestamp,
  onSelectSession,
}: {
  readonly sessionTitle: string;
  readonly sessionId: string;
  readonly timestamp: string;
  readonly onSelectSession: (sessionId: string) => void;
}) {
  const date = new Date(timestamp);
  const formatted = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-border-default" />
      <div className="flex items-center gap-2 rounded-full border border-border-default bg-surface-hover px-3 py-1">
        <span className="text-xs font-medium text-text-tertiary truncate max-w-48">
          {sessionTitle}
        </span>
        <span className="text-xs text-text-muted">{formatted}</span>
        <button
          onClick={() => onSelectSession(sessionId)}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          View session &rarr;
        </button>
      </div>
      <div className="h-px flex-1 bg-border-default" />
    </div>
  );
}

function DateDivider({ timestamp }: { readonly timestamp: string }) {
  const date = new Date(timestamp);
  const formatted = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-border-default" />
      <span className="text-xs text-text-muted">{formatted}</span>
      <div className="h-px flex-1 bg-border-default" />
    </div>
  );
}

function UnifiedMessageBubble({ message }: { readonly message: UnifiedMessage }) {
  const isUser = message.role === 'user';
  const theme = useThemeStore((s) => s.theme);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'border border-border-default bg-surface text-text-primary'
        }`}
      >
        <div className="mb-1 text-xs font-medium opacity-70">
          {isUser ? 'You' : 'Claude'}
          {message.modelUsed && !isUser && (
            <span className="ml-1 opacity-50">({message.modelUsed})</span>
          )}
        </div>
        <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function isDayGap(t1: string, t2: string): boolean {
  const d1 = new Date(t1);
  const d2 = new Date(t2);
  return Math.abs(d2.getTime() - d1.getTime()) > 24 * 60 * 60 * 1000;
}
