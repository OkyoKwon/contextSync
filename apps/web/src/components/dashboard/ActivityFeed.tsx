import type { ActivityAction } from '@context-sync/shared';
import { useActivity } from '../../hooks/use-activity';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';

const ACTION_LABELS: Record<ActivityAction, string> = {
  session_created: 'created a session',
  session_completed: 'completed a session',
  conflict_detected: 'triggered a conflict',
  conflict_resolved: 'resolved a conflict',
  collaborator_added: 'added a collaborator',
  collaborator_removed: 'removed a collaborator',
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function ActivityFeed() {
  const { data, isLoading } = useActivity();
  const entries = data?.data ?? [];

  return (
    <div className="rounded-xl border border-border-default bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">Activity Feed</h3>

      {isLoading && <Spinner size="sm" />}

      {!isLoading && entries.length === 0 && (
        <p className="text-xs text-text-tertiary">No activity yet</p>
      )}

      <div className="space-y-3">
        {entries.slice(0, 10).map((entry) => (
          <div key={entry.id} className="flex items-start gap-2.5">
            <Avatar src={entry.userAvatarUrl} name={entry.userName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text-primary">
                <span className="font-medium">{entry.userName}</span>{' '}
                <span className="text-text-secondary">
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </span>
              </p>
              <p className="text-[10px] text-text-tertiary">
                {formatRelativeTime(entry.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
