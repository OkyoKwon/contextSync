import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sessionsApi } from '../../api/sessions.api';
import type { LocalDirectory, BrowseDirectoryEntry } from '@context-sync/shared';

function shortPath(absolutePath: string): string {
  const home = absolutePath.match(/^\/Users\/[^/]+/)?.[0];
  if (home) {
    return absolutePath.replace(home, '~');
  }
  return absolutePath;
}

function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface DirectoryPickerProps {
  readonly value: string | null;
  readonly onChange: (directory: string | null) => void;
  readonly defaultToActive?: boolean;
}

function DirectoryItem({
  dir,
  selected,
  onSelect,
  showActivity,
}: {
  readonly dir: LocalDirectory;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly showActivity: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
        selected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-border-default hover:border-border-hover'
      }`}
    >
      <input
        type="radio"
        name="local-directory"
        checked={selected}
        onChange={onSelect}
        className="accent-blue-500"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {dir.isActive && <span className="inline-block h-2 w-2 rounded-full bg-green-500" />}
          <p className="truncate text-sm font-medium text-text-primary">{shortPath(dir.path)}</p>
        </div>
        <p className="text-xs text-text-tertiary">
          {dir.sessionCount} session{dir.sessionCount !== 1 ? 's' : ''}
          {showActivity && ` · ${relativeTime(dir.lastActivityAt)}`}
          <span className="ml-1.5 inline-flex rounded bg-zinc-700/60 px-1 py-0.5 text-[10px] font-medium leading-none text-text-muted">
            {dir.source === 'claude_code'
              ? 'CLI'
              : dir.source === 'claude_ai'
                ? 'Desktop'
                : 'CLI + Desktop'}
          </span>
        </p>
      </div>
    </label>
  );
}

function FolderBrowser({
  onSelect,
  onClose,
}: {
  readonly onSelect: (path: string) => void;
  readonly onClose: () => void;
}) {
  const [currentPath, setCurrentPath] = useState<string | undefined>(undefined);

  const { data, isLoading, error } = useQuery({
    queryKey: ['browse-directory', currentPath],
    queryFn: () => sessionsApi.browseDirectory(currentPath),
  });

  const entries: readonly BrowseDirectoryEntry[] = data?.data ?? [];

  const displayPath = currentPath ?? '~';
  const parentPath = currentPath ? currentPath.split('/').slice(0, -1).join('/') || '/' : undefined;

  return (
    <div className="rounded-lg border border-border-default bg-surface-secondary">
      <div className="flex items-center justify-between border-b border-border-default px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {parentPath !== undefined && (
            <button
              type="button"
              onClick={() => setCurrentPath(parentPath === '' ? '/' : parentPath)}
              className="shrink-0 rounded p-1 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
              title="Go up"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <p
            className="truncate text-xs font-medium text-text-secondary"
            title={currentPath ?? '~'}
          >
            {shortPath(displayPath)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-1 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-6 text-sm text-text-tertiary">
            Loading...
          </div>
        )}
        {error && <div className="px-3 py-4 text-sm text-red-400">Failed to read directory</div>}
        {!isLoading && !error && entries.length === 0 && (
          <div className="px-3 py-4 text-sm text-text-tertiary">No subdirectories</div>
        )}
        {entries.map((entry) => (
          <button
            key={entry.path}
            type="button"
            onClick={() => setCurrentPath(entry.path)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary transition-colors hover:bg-surface-hover"
          >
            <svg
              className="h-4 w-4 shrink-0 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <span className="truncate">{entry.name}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-border-default px-3 py-2">
        <button
          type="button"
          onClick={() => onSelect(currentPath ?? '~')}
          disabled={!currentPath}
          className="w-full rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Select this folder
        </button>
      </div>
    </div>
  );
}

export function DirectoryPicker({
  value,
  onChange,
  defaultToActive = false,
}: DirectoryPickerProps) {
  const [inactiveExpanded, setInactiveExpanded] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browsedPath, setBrowsedPath] = useState<string | null>(null);
  const defaultApplied = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ['local-directories'],
    queryFn: () => sessionsApi.listLocalDirectories(),
  });

  const directories = data?.data ?? [];

  const active = directories.filter((d) => d.isActive);
  const inactive = directories.filter((d) => !d.isActive);

  useEffect(() => {
    if (defaultToActive && !defaultApplied.current && active.length > 0 && value === null) {
      defaultApplied.current = true;
      onChange(active[0]!.path);
    }
  }, [defaultToActive, active, value, onChange]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
  };

  useEffect(() => {
    checkScroll();
  }, [inactiveExpanded, directories.length]);

  if (isLoading || directories.length === 0) return null;

  const isRadioSelected = directories.some((d) => d.path === value);
  const isBrowsedSelected = browsedPath !== null && value === browsedPath;

  const handleRadioSelect = (path: string) => {
    setBrowsedPath(null);
    setBrowseOpen(false);
    onChange(path);
  };

  const handleBrowseSelect = (path: string) => {
    setBrowsedPath(path);
    setBrowseOpen(false);
    onChange(path);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-secondary">
        Link Working Directory
      </label>
      <p className="text-xs text-text-tertiary">
        Active directories (marked with green dot) have running sessions. Source labels show CLI or
        Desktop App origin.
      </p>
      <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Detected</p>
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="max-h-56 space-y-1 overflow-y-auto pr-1"
        >
          {active.map((dir) => (
            <DirectoryItem
              key={dir.path}
              dir={dir}
              selected={isRadioSelected && value === dir.path}
              onSelect={() => handleRadioSelect(dir.path)}
              showActivity={false}
            />
          ))}

          {inactive.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setInactiveExpanded((prev) => !prev)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border-default py-2 text-xs font-medium text-text-tertiary transition-colors hover:border-border-hover hover:bg-surface-hover hover:text-text-secondary"
              >
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${inactiveExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                {inactiveExpanded
                  ? 'Hide inactive directories'
                  : `Show ${inactive.length} inactive director${inactive.length === 1 ? 'y' : 'ies'}`}
              </button>
              {inactiveExpanded &&
                inactive.map((dir) => (
                  <DirectoryItem
                    key={dir.path}
                    dir={dir}
                    selected={isRadioSelected && value === dir.path}
                    onSelect={() => handleRadioSelect(dir.path)}
                    showActivity
                  />
                ))}
            </>
          )}
        </div>
        {canScrollDown && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface to-transparent" />
        )}
      </div>

      <div className="flex items-center gap-3">
        <hr className="flex-1 border-border-default" />
        <span className="text-xs text-text-tertiary">or</span>
        <hr className="flex-1 border-border-default" />
      </div>

      {isBrowsedSelected && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-500 bg-blue-500/10 px-3 py-2">
          <svg
            className="h-4 w-4 shrink-0 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <p className="min-w-0 truncate text-sm font-medium text-text-primary">
            {shortPath(browsedPath)}
          </p>
          <button
            type="button"
            onClick={() => {
              setBrowsedPath(null);
              onChange(null);
            }}
            className="ml-auto shrink-0 rounded p-0.5 text-text-tertiary transition-colors hover:text-text-primary"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {browseOpen ? (
        <FolderBrowser onSelect={handleBrowseSelect} onClose={() => setBrowseOpen(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setBrowseOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-default py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:bg-surface-hover hover:text-text-primary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          Browse...
        </button>
      )}
    </div>
  );
}
