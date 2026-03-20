import { useState, useMemo, useCallback } from 'react';
import type { LocalProjectGroup, SyncSessionResult } from '@context-sync/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { useLocalSessions, useSyncSessions } from '../../hooks/use-session-sync';
import { useAuthStore } from '../../stores/auth.store';
import { shortPath } from '../../lib/format';

interface SessionSyncModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSyncComplete?: (projectPath: string) => void;
}

type ModalView =
  | { readonly type: 'list' }
  | { readonly type: 'syncing'; readonly projectPath: string }
  | { readonly type: 'result'; readonly projectPath: string; readonly result: SyncSessionResult };

function FolderIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
    </svg>
  );
}

export function SessionSyncModal({ isOpen, onClose, onSyncComplete }: SessionSyncModalProps) {
  const [view, setView] = useState<ModalView>({ type: 'list' });
  const projectId = useAuthStore((s) => s.currentProjectId);
  const { data, isLoading, error: fetchError } = useLocalSessions(false);
  const syncMutation = useSyncSessions();

  const groups: readonly LocalProjectGroup[] = data?.data ?? [];

  const unsyncedCountByProject = useMemo(() => {
    const counts = new Map<string, number>();
    for (const group of groups) {
      const count = group.sessions.filter((s) => !s.isSynced).length;
      counts.set(group.projectPath, count);
    }
    return counts;
  }, [groups]);

  const handleSyncProject = useCallback(async (group: LocalProjectGroup) => {
    const unsyncedIds = group.sessions
      .filter((s) => !s.isSynced)
      .map((s) => s.sessionId);

    if (unsyncedIds.length === 0) return;

    setView({ type: 'syncing', projectPath: group.projectPath });

    try {
      const response = await syncMutation.mutateAsync(unsyncedIds);
      setView({
        type: 'result',
        projectPath: group.projectPath,
        result: response.data!,
      });
    } catch {
      setView({ type: 'list' });
    }
  }, [syncMutation]);

  const handleBack = useCallback(() => {
    syncMutation.reset();
    setView({ type: 'list' });
  }, [syncMutation]);

  const handleClose = useCallback(() => {
    setView({ type: 'list' });
    syncMutation.reset();
    onClose();
  }, [onClose, syncMutation]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Sync Context">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
          <span className="ml-2 text-sm text-text-tertiary">Scanning local sessions...</span>
        </div>
      )}

      {!projectId && (
        <p className="text-sm text-red-400">
          No project selected. Please select a project first.
        </p>
      )}

      {fetchError && (
        <p className="text-sm text-red-400">
          {fetchError instanceof Error ? fetchError.message : 'Failed to load local sessions'}
        </p>
      )}

      {!isLoading && groups.length === 0 && !fetchError && projectId && (
        <div className="py-8 text-center">
          <p className="text-sm text-text-tertiary">
            No Claude Code sessions found in ~/.claude/projects/
          </p>
        </div>
      )}

      {/* Directory list view */}
      {!isLoading && groups.length > 0 && view.type === 'list' && (
        <>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {groups.map((group) => {
              const unsyncedCount = unsyncedCountByProject.get(group.projectPath) ?? 0;
              const allSynced = unsyncedCount === 0;

              return (
                <button
                  key={group.projectPath}
                  type="button"
                  disabled={allSynced}
                  onClick={() => handleSyncProject(group)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                    allSynced
                      ? 'cursor-default border-border-default bg-surface opacity-50'
                      : 'border-border-default bg-surface hover:border-border-input hover:bg-surface-hover'
                  }`}
                >
                  <FolderIcon className={`h-5 w-5 flex-shrink-0 ${allSynced ? 'text-text-muted' : 'text-text-muted'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-text-secondary">
                        {shortPath(group.projectPath)}
                      </span>
                      {group.isActive && (
                        <Badge variant="info">Active</Badge>
                      )}
                      {allSynced && (
                        <Badge variant="success">All synced</Badge>
                      )}
                    </div>
                    <span className="text-xs text-text-muted">
                      {group.totalSessionCount} session{group.totalSessionCount > 1 ? 's' : ''} · {group.totalMessages} msgs
                      {!allSynced && (
                        <> · <span className="text-blue-400">{unsyncedCount} to sync</span></>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Syncing view */}
      {view.type === 'syncing' && (
        <div className="flex flex-col items-center justify-center py-8">
          <Spinner size="md" />
          <p className="mt-3 text-sm text-text-tertiary">
            Syncing sessions from <span className="font-medium text-text-secondary">{shortPath(view.projectPath)}</span>...
          </p>
        </div>
      )}

      {/* Result view */}
      {view.type === 'result' && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <FolderIcon className="h-4 w-4 text-text-muted" />
            <span className="text-sm font-medium text-text-secondary">
              {shortPath(view.projectPath)}
            </span>
          </div>

          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {view.result.results.map((r) => (
              <div
                key={r.sessionId}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                  r.success
                    ? (r.detectedConflicts ?? 0) > 0
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-border-default bg-surface'
                    : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-secondary">
                    {r.sessionId.slice(0, 8)}...
                  </p>
                  {r.messageCount !== undefined && (
                    <p className="text-xs text-text-muted">{r.messageCount} messages</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {r.success ? (
                    (r.detectedConflicts ?? 0) > 0 ? (
                      <Badge variant="warning">{r.detectedConflicts} conflict{(r.detectedConflicts ?? 0) > 1 ? 's' : ''}</Badge>
                    ) : (
                      <Badge variant="success">Synced</Badge>
                    )
                  ) : (
                    <Badge variant="critical">Failed</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
            Synced {view.result.syncedCount} session(s).
            {view.result.results.some((r) => (r.detectedConflicts ?? 0) > 0) && (
              <> Conflicts detected — check the Conflicts page.</>
            )}
            {view.result.results.some((r) => !r.success) && (
              <span className="text-red-400">
                {' '}{view.result.results.filter((r) => !r.success).length} session(s) failed.
              </span>
            )}
          </div>
        </div>
      )}

      {syncMutation.error && view.type === 'list' && (
        <p className="mt-3 text-sm text-red-400">
          {syncMutation.error instanceof Error ? syncMutation.error.message : 'Sync failed'}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {view.type === 'result' && (
          <>
            <Button variant="secondary" onClick={handleBack}>
              Back
            </Button>
            {onSyncComplete && (
              <Button
                onClick={() => {
                  onSyncComplete(view.projectPath);
                }}
              >
                View Project
              </Button>
            )}
          </>
        )}
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
