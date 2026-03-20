import { Link } from 'react-router';
import type { Session } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { timeAgo } from '../../lib/date';

interface SessionCardProps {
  session: Session;
}

const sourceColors: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
  claude_code: 'info',
  claude_ai: 'warning',
  api: 'success',
  manual: 'default',
};

export function SessionCard({ session }: SessionCardProps) {
  return (
    <Link to={`/project/sessions/${session.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Avatar src={session.userAvatarUrl} name={session.userName ?? 'User'} size="sm" />
            <div>
              <h3 className="text-sm font-medium text-text-primary">{session.title}</h3>
              <p className="text-xs text-text-tertiary">
                {session.userName} &middot; {timeAgo(session.createdAt)}
              </p>
            </div>
          </div>
          <Badge variant={sourceColors[session.source] ?? 'default'}>
            {session.source.replace('_', ' ')}
          </Badge>
        </div>
        {session.filePaths.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {session.filePaths.slice(0, 3).map((path) => (
              <span key={path} className="rounded bg-surface-hover px-1.5 py-0.5 text-xs text-text-tertiary">
                {path}
              </span>
            ))}
            {session.filePaths.length > 3 && (
              <span className="text-xs text-text-muted">+{session.filePaths.length - 3} more</span>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
