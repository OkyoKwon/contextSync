import { useState, useMemo, useCallback } from 'react';
import { useLocalSessions, useSyncSessions } from '../hooks/use-session-sync';
import { LocalSessionList } from '../components/local-sessions/LocalSessionList';
import { LocalSessionConversation } from '../components/local-sessions/LocalSessionConversation';
import { ProjectConversationPanel } from '../components/local-sessions/ProjectConversationPanel';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

type Selection =
  | { readonly type: 'none' }
  | { readonly type: 'session'; readonly sessionId: string }
  | { readonly type: 'project'; readonly projectPath: string };

export function LocalSessionsPage() {
  const [showAll, setShowAll] = useState(true);
  const [selection, setSelection] = useState<Selection>({ type: 'none' });
  const [selectedSyncIds, setSelectedSyncIds] = useState<ReadonlySet<string>>(new Set());

  const activeOnly = !showAll;
  const { data, isLoading } = useLocalSessions(activeOnly);
  const syncMutation = useSyncSessions();

  const groups = useMemo(() => data?.data ?? [], [data]);

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

  const selectedSessionId = selection.type === 'session' ? selection.sessionId : null;
  const selectedProjectPath = selection.type === 'project' ? selection.projectPath : null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <h1 className="text-lg font-semibold text-[#FAFAFA]">Local Sessions</h1>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#A1A1AA]">
            <input
              type="checkbox"
              checked={showAll}
              onChange={() => setShowAll((v) => !v)}
              className="rounded border-zinc-700 bg-[#141414]"
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
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="md" />
          <span className="ml-2 text-sm text-[#A1A1AA]">Scanning local sessions...</span>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel — session list */}
          <div className="w-96 flex-shrink-0 border-r border-zinc-800">
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
          <div className="flex-1">
            {selection.type === 'project' && (
              <ProjectConversationPanel
                projectPath={selection.projectPath}
                onSelectSession={handleSelectSession}
              />
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
                <p className="text-sm text-[#71717A]">
                  Select a project to view all conversations, or a session for details.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sync result feedback */}
      {syncMutation.data?.data && (
        <div className="border-t border-zinc-800 bg-green-500/10 px-6 py-3 text-sm text-green-400">
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
        <div className="border-t border-zinc-800 bg-red-500/10 px-6 py-3 text-sm text-red-400">
          {syncMutation.error instanceof Error ? syncMutation.error.message : 'Sync failed'}
        </div>
      )}
    </div>
  );
}
