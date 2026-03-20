import { Link } from 'react-router';
import type { TimelineEntry } from '@context-sync/shared';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { timeAgo } from '../../lib/date';

interface TimelineItemProps {
  entry: TimelineEntry;
}

export function TimelineItem({ entry }: TimelineItemProps) {
  return (
    <Link to={`/sessions/${entry.id}`} className="block">
      <div className="flex gap-3 rounded-lg border border-border-default bg-surface p-4 transition-colors hover:bg-surface-hover">
        <Avatar src={entry.userAvatarUrl} name={entry.userName} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{entry.userName}</span>
            <Badge>{entry.source.replace('_', ' ')}</Badge>
            <span className="ml-auto text-xs text-text-muted">{timeAgo(entry.createdAt)}</span>
          </div>
          <p className="mt-0.5 text-sm text-text-secondary">{entry.title}</p>
          {entry.filePaths.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {entry.filePaths.slice(0, 3).map((path) => (
                <span key={path} className="rounded bg-surface-hover px-1.5 py-0.5 text-xs font-mono text-text-tertiary">
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
