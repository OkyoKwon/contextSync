import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sessionsApi } from '../../api/sessions.api';
import type { LocalDirectory } from '@context-sync/shared';

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
          {dir.isActive && (
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          )}
          <p className="truncate text-sm font-medium text-text-primary">
            {shortPath(dir.path)}
          </p>
        </div>
        <p className="text-xs text-text-tertiary">
          {dir.sessionCount} session{dir.sessionCount !== 1 ? 's' : ''}
          {showActivity && ` · ${relativeTime(dir.lastActivityAt)}`}
        </p>
      </div>
    </label>
  );
}

export function DirectoryPicker({ value, onChange, defaultToActive = false }: DirectoryPickerProps) {
  const [inactiveExpanded, setInactiveExpanded] = useState(false);
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

  if (isLoading || directories.length === 0) return null;

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

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-secondary">
        Link Local Directory
      </label>
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
              selected={value === dir.path}
              onSelect={() => onChange(dir.path)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                    selected={value === dir.path}
                    onSelect={() => onChange(dir.path)}
                    showActivity
                  />
                ))}
            </>
          )}

          <label
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
              value === null
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-border-default hover:border-border-hover'
            }`}
          >
            <input
              type="radio"
              name="local-directory"
              checked={value === null}
              onChange={() => onChange(null)}
              className="accent-blue-500"
            />
            <p className="text-sm text-text-secondary">Don't link a directory</p>
          </label>
        </div>
        {canScrollDown && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface to-transparent" />
        )}
      </div>
    </div>
  );
}
