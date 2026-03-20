import { useState, useMemo } from 'react';
import type { LocalProjectGroup, LocalSessionInfo } from '@context-sync/shared';
import { Badge } from '../ui/Badge';
import { shortPath } from '../../lib/format';
import { timeAgo } from '../../lib/date';

interface LocalSessionListProps {
  readonly groups: readonly LocalProjectGroup[];
  readonly selectedSessionId: string | null;
  readonly selectedProjectPath: string | null;
  readonly selectedSyncIds: ReadonlySet<string>;
  readonly onSelectSession: (sessionId: string) => void;
  readonly onSelectProject: (projectPath: string) => void;
  readonly onToggleSync: (sessionId: string) => void;
}

export function LocalSessionList({
  groups,
  selectedSessionId,
  selectedProjectPath,
  selectedSyncIds,
  onSelectSession,
  onSelectProject,
  onToggleSync,
}: LocalSessionListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;

    const query = searchQuery.toLowerCase();
    return groups
      .map((group) => {
        const matchesPath = shortPath(group.projectPath).toLowerCase().includes(query);
        const filteredSessions = group.sessions.filter(
          (s) => matchesPath || s.firstMessage.toLowerCase().includes(query),
        );
        if (filteredSessions.length === 0) return null;
        return {
          ...group,
          sessions: filteredSessions as readonly LocalSessionInfo[],
          totalMessages: filteredSessions.reduce((sum, s) => sum + s.messageCount, 0),
        } as LocalProjectGroup;
      })
      .filter((g): g is LocalProjectGroup => g !== null);
  }, [groups, searchQuery]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border-default p-3">
        <input
          type="text"
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-border-input bg-page px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {filteredGroups.length === 0 && (
          <div className="py-8 text-center text-sm text-text-tertiary">
            {searchQuery ? (
              <p>
                No sessions match your search.{' '}
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-blue-400 hover:underline"
                >
                  Clear search
                </button>
              </p>
            ) : (
              <p>No local sessions found. Start a Claude Code session to see it here.</p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <ProjectGroup
              key={group.projectPath}
              group={group}
              selectedSessionId={selectedSessionId}
              isProjectSelected={group.projectPath === selectedProjectPath}
              selectedSyncIds={selectedSyncIds}
              onSelectSession={onSelectSession}
              onSelectProject={onSelectProject}
              onToggleSync={onToggleSync}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FolderIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
    </svg>
  );
}

function ProjectGroup({
  group,
  selectedSessionId,
  isProjectSelected,
  selectedSyncIds,
  onSelectSession,
  onSelectProject,
  onToggleSync,
}: {
  readonly group: LocalProjectGroup;
  readonly selectedSessionId: string | null;
  readonly isProjectSelected: boolean;
  readonly selectedSyncIds: ReadonlySet<string>;
  readonly onSelectSession: (sessionId: string) => void;
  readonly onSelectProject: (projectPath: string) => void;
  readonly onToggleSync: (sessionId: string) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onSelectProject(group.projectPath)}
        className={`mb-1.5 flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors ${
          isProjectSelected
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-border-default bg-surface hover:border-border-input hover:bg-surface-hover'
        }`}
      >
        <FolderIcon className={`h-4 w-4 flex-shrink-0 ${isProjectSelected ? 'text-blue-400' : 'text-text-muted'}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={`truncate text-sm font-medium ${isProjectSelected ? 'text-blue-400' : 'text-text-secondary'}`}>
              {shortPath(group.projectPath)}
            </span>
            {group.isActive && (
              <span className="inline-block h-2 w-2 rounded-full bg-green-400" title="Active" />
            )}
          </div>
          <span className="text-xs text-text-muted">
            {group.sessions.length} session{group.sessions.length > 1 ? 's' : ''} · {group.totalMessages} msgs
          </span>
        </div>
      </button>

      <div className="space-y-1">
        {group.sessions.map((session) => (
          <SessionRow
            key={session.sessionId}
            session={session}
            isSelected={session.sessionId === selectedSessionId}
            isSyncChecked={selectedSyncIds.has(session.sessionId)}
            onSelect={() => onSelectSession(session.sessionId)}
            onToggleSync={() => onToggleSync(session.sessionId)}
          />
        ))}
      </div>
    </div>
  );
}

function SessionRow({
  session,
  isSelected,
  isSyncChecked,
  onSelect,
  onToggleSync,
}: {
  readonly session: LocalSessionInfo;
  readonly isSelected: boolean;
  readonly isSyncChecked: boolean;
  readonly onSelect: () => void;
  readonly onToggleSync: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-2 rounded-lg border p-2.5 text-left transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-border-default hover:border-border-input hover:bg-surface-hover'
      }`}
    >
      <input
        type="checkbox"
        checked={session.isSynced || isSyncChecked}
        disabled={session.isSynced}
        aria-label={session.isSynced ? 'Already synced' : 'Select for sync'}
        onChange={(e) => {
          e.stopPropagation();
          if (!session.isSynced) onToggleSync();
        }}
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5 rounded border-border-input bg-page"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-text-primary">
            {session.firstMessage}
          </p>
          {session.isSynced && <Badge variant="success">Synced</Badge>}
          {session.isActive && !session.isSynced && (
            <Badge variant="info">Active</Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-text-muted">
          {session.messageCount} messages · {timeAgo(session.lastModifiedAt)}
        </p>
      </div>
    </button>
  );
}
