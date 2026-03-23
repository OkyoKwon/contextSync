import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLocalSessions, useSyncSessions } from '../hooks/use-session-sync';
import { useCurrentProject } from '../hooks/use-current-project';
import { LocalSessionList } from '../components/local-sessions/LocalSessionList';
import { LocalSessionConversation } from '../components/local-sessions/LocalSessionConversation';
import { ProjectConversationPanel } from '../components/local-sessions/ProjectConversationPanel';
import { DirectoryGuidance } from '../components/local-sessions/DirectoryGuidance';
import { SyncStatusIndicator } from '../components/local-sessions/SyncStatusIndicator';
import { ChangeDirectoryModal } from '../components/projects/ChangeDirectoryModal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { SessionListSkeleton } from '../components/local-sessions/SessionListSkeleton';
import { Badge } from '../components/ui/Badge';
import { shortPath } from '../lib/format';
import { timeAgo } from '../lib/date';
import { useAuthStore } from '../stores/auth.store';
import { useRequireProject } from '../hooks/use-require-project';
import { sessionsApi } from '../api/sessions.api';
import { showToast } from '../lib/toast';
import { PageBreadcrumb } from '../components/layout/PageBreadcrumb';
import { NoProjectState } from '../components/shared/NoProjectState';
import { SessionUploadModal } from '../components/sessions/SessionUploadModal';

type Selection =
  | { readonly type: 'none' }
  | { readonly type: 'session'; readonly sessionId: string }
  | { readonly type: 'project'; readonly projectPath: string };

export function ProjectPage() {
  const [selection, setSelection] = useState<Selection>({ type: 'none' });
  const [isSyncedExpanded, setIsSyncedExpanded] = useState(false);
  const [isChangeDirectoryOpen, setIsChangeDirectoryOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { isProjectSelected, isLoading: isProjectLoading } = useRequireProject();
  const projectId = useAuthStore((s) => s.currentProjectId);
  const { data: projectData } = useCurrentProject();
  const currentProject = projectData?.data ?? null;

  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useLocalSessions(false);
  const syncMutation = useSyncSessions();

  const handleExport = useCallback(async () => {
    if (!projectId || exporting) return;
    setExporting(true);
    try {
      const blob = await sessionsApi.exportMarkdown(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sessions-export.md';
      a.click();
      URL.revokeObjectURL(url);
      showToast.success('Markdown exported successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      showToast.error(message);
    } finally {
      setExporting(false);
    }
  }, [projectId, exporting]);

  const groups = useMemo(() => data?.data ?? [], [data]);

  // Auto-select the project path when there's exactly one group
  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (autoSelectedRef.current) return;
    if (groups.length === 1 && selection.type === 'none' && groups[0]) {
      setSelection({ type: 'project', projectPath: groups[0].projectPath });
      autoSelectedRef.current = true;
    }
  }, [groups, selection.type]);

  const syncedSessionsForProject = useMemo(() => {
    if (selection.type !== 'project') return [];
    const group = groups.find((g) => g.projectPath === selection.projectPath);
    if (!group) return [];
    return group.sessions.filter((s) => s.isSynced);
  }, [groups, selection]);

  const handleSingleSync = async (sessionId: string) => {
    await syncMutation.mutateAsync([sessionId]);
  };

  const handleSelectSession = useCallback((sessionId: string) => {
    setSelection({ type: 'session', sessionId });
  }, []);

  const handleSelectProject = useCallback((projectPath: string) => {
    setSelection({ type: 'project', projectPath });
  }, []);

  const handleSyncProject = useCallback(
    async (group: {
      readonly sessions: readonly { readonly sessionId: string; readonly isSynced: boolean }[];
    }) => {
      const unsyncedIds = group.sessions.filter((s) => !s.isSynced).map((s) => s.sessionId);
      if (unsyncedIds.length === 0) return;
      await syncMutation.mutateAsync(unsyncedIds);
    },
    [syncMutation],
  );

  // Auto-sync: automatically sync unsynced local sessions
  const autoSyncedRef = useRef<ReadonlySet<string>>(new Set());
  useEffect(() => {
    if (syncMutation.isPending) return;

    const unsyncedIds: string[] = [];
    for (const group of groups) {
      for (const session of group.sessions) {
        if (!session.isSynced && !autoSyncedRef.current.has(session.sessionId)) {
          unsyncedIds.push(session.sessionId);
        }
      }
    }

    if (unsyncedIds.length === 0) return;

    autoSyncedRef.current = new Set([...autoSyncedRef.current, ...unsyncedIds]);
    syncMutation.mutateAsync(unsyncedIds);
  }, [groups, syncMutation]);

  const selectedSessionId = selection.type === 'session' ? selection.sessionId : null;
  const selectedProjectPath = selection.type === 'project' ? selection.projectPath : null;
  const isSelectedSessionSynced = useMemo(() => {
    if (!selectedSessionId) return false;
    return groups.some((g) =>
      g.sessions.some((s) => s.sessionId === selectedSessionId && s.isSynced),
    );
  }, [groups, selectedSessionId]);

  const myDirectory = currentProject?.myLocalDirectory ?? null;

  if (isProjectLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isProjectSelected) {
    return (
      <div>
        <div className="mb-6">
          <PageBreadcrumb pageName="Conversations" />
        </div>
        <NoProjectState pageName="Conversations" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default px-6 py-3">
        <div className="flex items-center gap-3">
          <PageBreadcrumb pageName="Conversations" />
          {myDirectory && (
            <span className="flex items-center gap-1.5 text-sm text-text-tertiary">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
              </svg>
              {shortPath(myDirectory)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-border-primary bg-bg-secondary px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            Import
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || !projectId}
            className="flex items-center gap-1.5 rounded-md border border-border-primary bg-bg-secondary px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary disabled:opacity-50"
          >
            {exporting ? (
              <Spinner size="sm" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
            )}
            Export Markdown
          </button>
          <Button variant="secondary" onClick={() => setIsChangeDirectoryOpen(true)}>
            {myDirectory ? 'Change My Directory' : 'Link My Directory'}
          </Button>
        </div>
        <SyncStatusIndicator syncMutation={syncMutation} />
      </div>

      {/* Content */}
      {!myDirectory ? (
        <DirectoryGuidance onOpenDirectoryModal={() => setIsChangeDirectoryOpen(true)} />
      ) : isLoading ? (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-96 flex-shrink-0 border-r border-border-default">
            <SessionListSkeleton />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-text-tertiary">Scanning local sessions...</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel — session list */}
          <div className="w-96 flex-shrink-0 border-r border-border-default">
            <LocalSessionList
              groups={groups}
              selectedSessionId={selectedSessionId}
              selectedProjectPath={selectedProjectPath}
              onSelectSession={handleSelectSession}
              onSelectProject={handleSelectProject}
              onSyncProject={handleSyncProject}
              isSyncing={syncMutation.isPending}
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
                    <button
                      type="button"
                      onClick={() => setIsSyncedExpanded((v) => !v)}
                      className="flex w-full items-center gap-2 text-sm font-medium text-text-tertiary hover:text-text-secondary"
                    >
                      <svg
                        className={`h-4 w-4 transition-transform ${isSyncedExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      Synced Sessions ({syncedSessionsForProject.length})
                    </button>
                    {isSyncedExpanded && (
                      <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
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
                    )}
                  </div>
                )}
              </div>
            )}
            {selection.type === 'session' && (
              <LocalSessionConversation
                sessionId={selection.sessionId}
                isSynced={isSelectedSessionSynced}
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

      {projectId && (
        <ChangeDirectoryModal
          isOpen={isChangeDirectoryOpen}
          onClose={() => setIsChangeDirectoryOpen(false)}
          projectId={projectId}
          currentDirectory={myDirectory}
        />
      )}

      <SessionUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </div>
  );
}
