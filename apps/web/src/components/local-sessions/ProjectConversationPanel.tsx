import { useEffect } from 'react';
import { Spinner } from '../ui/Spinner';
import { UnifiedMessageThread } from './UnifiedMessageThread';
import { useLocalProjectConversation } from '../../hooks/use-local-project-conversation';
import { shortPath, pluralize } from '../../lib/format';

interface ProjectConversationPanelProps {
  readonly projectPath: string;
  readonly onSelectSession: (sessionId: string) => void;
}

export function ProjectConversationPanel({
  projectPath,
  onSelectSession,
}: ProjectConversationPanelProps) {
  const {
    messages,
    sessionCount,
    totalMessages,
    hasMore,
    isLoading,
    error,
    loadMore,
    reset,
  } = useLocalProjectConversation(projectPath);

  useEffect(() => {
    reset();
  }, [projectPath, reset]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="md" />
        <span className="ml-2 text-sm text-text-tertiary">Loading project conversation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : 'Failed to load project conversation'}
        </p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-text-muted">No messages found in this project.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border-default p-4">
        <h2 className="text-lg font-semibold text-text-primary">
          {shortPath(projectPath)}
        </h2>
        <p className="mt-1 text-sm text-text-tertiary">
          {pluralize(sessionCount, 'session')} · {pluralize(totalMessages, 'message')}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <UnifiedMessageThread
          messages={messages}
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
          onSelectSession={onSelectSession}
        />
      </div>
    </div>
  );
}
