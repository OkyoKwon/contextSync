import { useTeamStats } from '../../hooks/use-sessions';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';

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

export function TeamActivityPanel() {
  const { data, isLoading } = useTeamStats();
  const members = data?.data ?? [];

  return (
    <div className="rounded-xl border border-border-default bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">Team Activity</h3>

      {isLoading && <Spinner size="sm" />}

      {!isLoading && members.length === 0 && (
        <p className="text-xs text-text-tertiary">No team activity this week</p>
      )}

      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.userId} className="flex items-center gap-2.5">
            <Avatar src={member.userAvatarUrl} name={member.userName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-text-primary">{member.userName}</p>
              <p className="text-[10px] text-text-tertiary">
                {member.sessionCount} session{member.sessionCount !== 1 ? 's' : ''} · {formatRelativeTime(member.lastActiveAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
