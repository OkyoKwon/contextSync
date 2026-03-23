import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { LocalProjectGroup, LocalSessionInfo } from '@context-sync/shared';
import { Badge } from '../ui/Badge';
import { shortPath } from '../../lib/format';
import { timeAgo } from '../../lib/date';
import {
  SessionFilters,
  filterSession,
  sortSessions,
  type FilterType,
  type SortType,
} from './SessionFilters';

function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return String(tokens);
}

type VirtualItem =
  | { readonly type: 'group'; readonly group: LocalProjectGroup }
  | { readonly type: 'session'; readonly session: LocalSessionInfo; readonly groupPath: string };

interface LocalSessionListProps {
  readonly groups: readonly LocalProjectGroup[];
  readonly selectedSessionId: string | null;
  readonly selectedProjectPath: string | null;
  readonly onSelectSession: (sessionId: string) => void;
  readonly onSelectProject: (projectPath: string) => void;
  readonly onSyncProject: (group: LocalProjectGroup) => void;
  readonly isSyncing: boolean;
}

export function LocalSessionList({
  groups,
  selectedSessionId,
  selectedProjectPath,
  onSelectSession,
  onSelectProject,
}: LocalSessionListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredGroups = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return groups
      .map((group) => {
        const matchesPath = !query || shortPath(group.projectPath).toLowerCase().includes(query);
        const filtered = group.sessions
          .filter((s) => matchesPath || s.firstMessage.toLowerCase().includes(query))
          .filter((s) => filterSession(s, filter));
        const sorted = sortSessions(filtered, sort);
        if (sorted.length === 0) return null;
        return {
          ...group,
          sessions: sorted as readonly LocalSessionInfo[],
          totalMessages: sorted.reduce((sum, s) => sum + s.messageCount, 0),
          totalSessionCount: sorted.length,
        } as LocalProjectGroup;
      })
      .filter((g): g is LocalProjectGroup => g !== null);
  }, [groups, searchQuery, filter, sort]);

  const flatItems = useMemo(() => {
    const items: VirtualItem[] = [];
    for (const group of filteredGroups) {
      items.push({ type: 'group', group });
      for (const session of group.sessions) {
        items.push({ type: 'session', session, groupPath: group.projectPath });
      }
    }
    return items;
  }, [filteredGroups]);

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = flatItems[index];
      return item?.type === 'group' ? 68 : 72;
    },
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan: 5,
  });

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
        <div className="mt-2">
          <SessionFilters
            activeFilter={filter}
            activeSort={sort}
            onFilterChange={setFilter}
            onSortChange={setSort}
          />
        </div>
      </div>

      <div ref={parentRef} className="flex-1 overflow-y-auto">
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
              <p>No local sessions found. Start a Claude Code (CLI) session to see it here.</p>
            )}
          </div>
        )}

        {flatItems.length > 0 && (
          <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = flatItems[virtualRow.index];
              if (!item) return null;
              return (
                <div
                  key={virtualRow.key}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                  className="absolute left-0 top-0 w-full px-3 py-1"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {item.type === 'group' ? (
                    <GroupHeader
                      group={item.group}
                      isProjectSelected={item.group.projectPath === selectedProjectPath}
                      onSelectProject={onSelectProject}
                    />
                  ) : (
                    <SessionRow
                      session={item.session}
                      isSelected={item.session.sessionId === selectedSessionId}
                      onSelect={() => onSelectSession(item.session.sessionId)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FolderIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
    </svg>
  );
}

function GroupHeader({
  group,
  isProjectSelected,
  onSelectProject,
}: {
  readonly group: LocalProjectGroup;
  readonly isProjectSelected: boolean;
  readonly onSelectProject: (projectPath: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelectProject(group.projectPath)}
      className={`flex w-full items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left transition-colors focus:outline-none ${
        isProjectSelected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-border-default bg-zinc-800/50 hover:border-border-input hover:bg-surface-hover'
      }`}
    >
      <FolderIcon
        className={`h-4 w-4 flex-shrink-0 ${isProjectSelected ? 'text-blue-400' : 'text-text-muted'}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`truncate text-sm font-semibold ${isProjectSelected ? 'text-blue-400' : 'text-text-secondary'}`}
          >
            {shortPath(group.projectPath)}
          </span>
          {group.isActive && (
            <Badge variant="default" className="whitespace-nowrap">
              Current
            </Badge>
          )}
        </div>
        <span className="text-xs text-text-muted">
          {group.totalSessionCount} session{group.totalSessionCount > 1 ? 's' : ''} ·{' '}
          {group.totalMessages} msgs
        </span>
      </div>
    </button>
  );
}

function SessionRow({
  session,
  isSelected,
  onSelect,
}: {
  readonly session: LocalSessionInfo;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-2 rounded-lg border p-2.5 text-left transition-colors focus:outline-none ${
        isSelected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-border-default hover:border-border-input hover:bg-surface-hover'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-text-primary">{session.firstMessage}</p>
          {session.isSynced && (
            <Badge variant="success" title="Saved to database">
              Synced
            </Badge>
          )}
          {session.isActive && (
            <Badge variant="info" title="Used within 10 min">
              Active
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-text-muted">
          {session.messageCount} messages
          {session.totalTokens > 0 && ` · ${formatTokenCount(session.totalTokens)} tokens`}
          {' · '}
          {timeAgo(session.lastModifiedAt)}
        </p>
      </div>
    </button>
  );
}
