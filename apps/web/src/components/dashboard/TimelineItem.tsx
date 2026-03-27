import { Link } from 'react-router';
import type { TimelineEntry } from '@context-sync/shared';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { timeAgo } from '../../lib/date';

interface TimelineItemProps {
  readonly entry: TimelineEntry;
  readonly onDelete?: (id: string, title: string) => void;
}

export function TimelineItem({ entry, onDelete }: TimelineItemProps) {
  return (
    <Link to={`/sessions/${entry.id}`} className="group/item block">
      <div className="flex gap-3 rounded-lg border border-border-default bg-surface p-4 transition-colors hover:bg-surface-hover">
        <Avatar src={entry.userAvatarUrl} name={entry.userName} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{entry.userName}</span>
            <Badge>{entry.source.replace('_', ' ')}</Badge>
            <span className="ml-auto text-xs text-text-muted">{timeAgo(entry.createdAt)}</span>
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(entry.id, entry.title);
                }}
                className="rounded p-1 text-text-muted opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover/item:opacity-100"
                title="Delete session"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            )}
          </div>
          <p className="mt-0.5 text-sm text-text-secondary">{entry.title}</p>
          {entry.filePaths.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {entry.filePaths.slice(0, 3).map((path) => (
                <span
                  key={path}
                  className="rounded bg-surface-hover px-1.5 py-0.5 text-xs font-mono text-text-tertiary"
                >
                  {path}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
