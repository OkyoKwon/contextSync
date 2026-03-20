import { useState, useMemo, useCallback } from 'react';
import { useLocalSessions, useSyncSessions } from '../hooks/use-session-sync';
import { LocalSessionList } from '../components/local-sessions/LocalSessionList';
import { LocalSessionConversation } from '../components/local-sessions/LocalSessionConversation';
import { ProjectConversationPanel } from '../components/local-sessions/ProjectConversationPanel';
import { SessionSyncModal } from '../components/sessions/SessionSyncModal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { timeAgo } from '../lib/date';

type Selection =
  | { readonly type: 'none' }
  | { readonly type: 'session'; readonly sessionId: string }
  | { readonly type: 'project'; readonly projectPath: string };

export function ProjectPage() {
  const [showAll, setShowAll] = useState(true);
  const [selection, setSelection] = useState<Selection>({ type: 'none' });
  const [selectedSyncIds, setSelectedSyncIds] = useState<ReadonlySet<string>>(new Set());
  const [isSyncOpen, setIsSyncOpen] = useState(false);

  const activeOnly = !showAll;
  const { data, isLoading } = useLocalSessions(activeOnly);
  const syncMutation = useSyncSessions();

  const groups = useMemo(() => data?.data ?? [], [data]);

  const syncedSessionsForProject = useMemo(() => {
    if (selection.type !== 'project') return [];
    const group = groups.find((g) => g.projectPath === selection.projectPath);
    if (!group) return [];
    return group.sessions.filter((s) => s.isSynced);
  }, [groups, selection]);

  const toggleSync = (sessionId: string) => {
    setSelectedSyncIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const handleBulkSync = async () => {
    if (selectedSyncIds.size === 0) return;
    await syncMutation.mutateAsync([...selectedSyncIds]);
    setSelectedSyncIds(new Set());
  };

  const handleSingleSync = async (sessionId: string) => {
    await syncMutation.mutateAsync([sessionId]);
  };

  const handleSelectSession = useCallback((sessionId: string) => {
    setSelection({ type: 'session', sessionId });
  }, []);

  const handleSelectProject = useCallback((projectPath: string) => {
    setSelection({ type: 'project', projectPath });
  }, []);

  const handleSyncComplete = useCallback((projectPath: string) => {
    setSelection({ type: 'project', projectPath });
    setIsSyncOpen(false);
  }, []);

  const selectedSessionId = selection.type === 'session' ? selection.sessionId : null;
  const selectedProjectPath = selection.type === 'project' ? selection.projectPath : null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default px-6 py-3">
        <h1 className="text-lg font-semibold text-text-primary">Project</h1>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-tertiary">
            <input
              type="checkbox"
              checked={showAll}
              onChange={() => setShowAll((v) => !v)}
              className="rounded border-border-input bg-page"
            />
            Show all
          </label>
          {selectedSyncIds.size > 0 && (
            <Button onClick={handleBulkSync} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? (
                <Spinner size="sm" />
              ) : (
                `Sync selected (${selectedSyncIds.size})`
              )}
            </Button>
          )}
          <Button onClick={() => setIsSyncOpen(true)}>Sync Context</Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="md" />
          <span className="ml-2 text-sm text-text-tertiary">Scanning local sessions...</span>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel — session list */}
          <div className="w-96 flex-shrink-0 border-r border-border-default">
            <LocalSessionList
              groups={groups}
              selectedSessionId={selectedSessionId}
              selectedProjectPath={selectedProjectPath}
              selectedSyncIds={selectedSyncIds}
              onSelectSession={handleSelectSession}
              onSelectProject={handleSelectProject}
              onToggleSync={toggleSync}
            />
          </div>

          {/* Right panel — conversation detail */}
          <div className="flex-1 overflow-y-auto">
            {selection.type === 'project' && (
              <div className="flex h-full flex-col">
                <div className="flex-1 overflow-y-auto">
                  <ProjectConversationPanel
                    projectPath={selection.projectPath}
                    onSelectSession={handleSelectSession}
                  />
                </div>

                {/* Synced sessions for this project */}
                {syncedSessionsForProject.length > 0 && (
                  <div className="border-t border-border-default px-6 py-4">
                    <h3 className="mb-3 text-sm font-medium text-text-tertiary">
                      Synced Sessions ({syncedSessionsForProject.length})
                    </h3>
                    <div className="space-y-2">
                      {syncedSessionsForProject.map((session) => (
                        <button
                          key={session.sessionId}
                          type="button"
                          onClick={() => handleSelectSession(session.sessionId)}
                          className="flex w-full items-center justify-between rounded-lg border border-border-default bg-surface px-4 py-3 text-left transition-colors hover:border-border-input hover:bg-surface-hover"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-text-secondary">
                              {session.firstMessage || session.sessionId.slice(0, 12)}
                            </p>
                            <p className="text-xs text-text-muted">
                              {session.messageCount} messages · {timeAgo(session.lastModifiedAt)}
                            </p>
                          </div>
                          <Badge variant="success">Synced</Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {selection.type === 'session' && (
              <LocalSessionConversation
                sessionId={selection.sessionId}
                isSyncing={syncMutation.isPending}
                onSync={handleSingleSync}
              />
            )}
            {selection.type === 'none' && (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-text-muted">
                  Select a project to view all conversations, or a session for details.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sync result feedback */}
      {syncMutation.data?.data && (
        <div className="border-t border-border-default bg-green-500/10 px-6 py-3 text-sm text-green-400">
          Synced {syncMutation.data.data.syncedCount} session(s).
          {syncMutation.data.data.results.some((r) => (r.detectedConflicts ?? 0) > 0) && (
            <> Conflicts detected — check the Conflicts page.</>
          )}
          {syncMutation.data.data.results.some((r) => !r.success) && (
            <span className="text-red-400">
              {' '}
              {syncMutation.data.data.results.filter((r) => !r.success).length} session(s) failed.
            </span>
          )}
        </div>
      )}

      {syncMutation.error && (
        <div className="border-t border-border-default bg-red-500/10 px-6 py-3 text-sm text-red-400">
          {syncMutation.error instanceof Error ? syncMutation.error.message : 'Sync failed'}
        </div>
      )}

      <SessionSyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        onSyncComplete={handleSyncComplete}
      />
    </div>
  );
}
