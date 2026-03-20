import { useState, useMemo } from 'react';
import type { LocalProjectGroup, LocalSessionInfo } from '@context-sync/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { useLocalSessions, useSyncSessions } from '../../hooks/use-session-sync';
import { useAuthStore } from '../../stores/auth.store';
import { formatTimeAgo, shortPath } from '../../lib/format';

interface SessionSyncModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function SessionSyncModal({ isOpen, onClose }: SessionSyncModalProps) {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const activeOnly = !showAll;
  const projectId = useAuthStore((s) => s.currentProjectId);
  const { data, isLoading, error: fetchError } = useLocalSessions(activeOnly);
  const syncMutation = useSyncSessions();

  const groups: readonly LocalProjectGroup[] = data?.data ?? [];

  // Server already filters by activeOnly — show all returned groups
  const visibleGroups = groups;

  const allUnsyncedSessions = useMemo(() => {
    const sessions: LocalSessionInfo[] = [];
    for (const group of visibleGroups) {
      for (const s of group.sessions) {
        if (!s.isSynced) sessions.push(s);
      }
    }
    return sessions;
  }, [visibleGroups]);

  const toggleSession = (sessionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === allUnsyncedSessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allUnsyncedSessions.map((s) => s.sessionId)));
    }
  };

  const handleSync = async () => {
    if (selectedIds.size === 0) return;
    await syncMutation.mutateAsync([...selectedIds]);
    setSelectedIds(new Set());
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    syncMutation.reset();
    setShowAll(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Sync Sessions">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
          <span className="ml-2 text-sm text-gray-500">Scanning local sessions...</span>
        </div>
      )}

      {!projectId && (
        <p className="text-sm text-red-600">
          No project selected. Please select a project first.
        </p>
      )}

      {fetchError && (
        <p className="text-sm text-red-600">
          {fetchError instanceof Error ? fetchError.message : 'Failed to load local sessions'}
        </p>
      )}

      {!isLoading && groups.length === 0 && !fetchError && projectId && (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">
            {activeOnly
              ? 'No active Claude Code sessions found.'
              : 'No Claude Code sessions found in ~/.claude/projects/'}
          </p>
          {activeOnly && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Show all sessions
            </button>
          )}
        </div>
      )}

      {!isLoading && groups.length > 0 && (
        <>
          <div className="mb-3 flex items-center justify-between">
            {allUnsyncedSessions.length > 0 && (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={selectedIds.size === allUnsyncedSessions.length && allUnsyncedSessions.length > 0}
                  onChange={toggleAll}
                  className="rounded border-gray-300"
                />
                Select all ({allUnsyncedSessions.length})
              </label>
            )}
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showAll ? 'Show active only' : 'Show all sessions'}
            </button>
          </div>

          <div className="max-h-96 space-y-4 overflow-y-auto">
            {visibleGroups.map((group) => (
              <div key={group.projectPath}>
                <div className="mb-1.5 flex items-center gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {shortPath(group.projectPath)}
                  </h3>
                  {group.isActive && (
                    <span className="inline-block h-2 w-2 rounded-full bg-green-400" title="Active" />
                  )}
                  <span className="text-xs text-gray-400">
                    {group.sessions.length} session{group.sessions.length > 1 ? 's' : ''} · {group.totalMessages} msgs
                  </span>
                </div>

                <div className="space-y-1.5">
                  {group.sessions.map((session) => {
                    const isSynced = session.isSynced;
                    const isSelected = selectedIds.has(session.sessionId);

                    return (
                      <label
                        key={session.sessionId}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          isSynced
                            ? 'cursor-default border-gray-200 bg-gray-50 opacity-60'
                            : isSelected
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSynced || isSelected}
                          disabled={isSynced}
                          onChange={() => !isSynced && toggleSession(session.sessionId)}
                          className="mt-0.5 rounded border-gray-300"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {session.firstMessage}
                            </p>
                            {isSynced && <Badge variant="success">Synced</Badge>}
                            {session.isActive && !isSynced && (
                              <Badge variant="info">Active</Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {session.messageCount} messages · {formatTimeAgo(session.lastModifiedAt)}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {syncMutation.error && (
        <p className="mt-3 text-sm text-red-600">
          {syncMutation.error instanceof Error ? syncMutation.error.message : 'Sync failed'}
        </p>
      )}

      {syncMutation.data?.data && (
        <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Synced {syncMutation.data.data.syncedCount} session(s).
          {syncMutation.data.data.results.some((r) => (r.detectedConflicts ?? 0) > 0) && (
            <> Conflicts detected — check the Conflicts page.</>
          )}
          {syncMutation.data.data.results.some((r) => !r.success) && (
            <span className="text-red-600">
              {' '}
              {syncMutation.data.data.results.filter((r) => !r.success).length} session(s) failed.
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button
          onClick={handleSync}
          disabled={selectedIds.size === 0 || syncMutation.isPending}
        >
          {syncMutation.isPending ? (
            <Spinner size="sm" />
          ) : (
            `Sync${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`
          )}
        </Button>
      </div>
    </Modal>
  );
}
