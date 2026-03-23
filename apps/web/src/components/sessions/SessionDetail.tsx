import type { SessionWithMessages } from '@context-sync/shared';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { MessageThread } from './MessageThread';
import { formatDate } from '../../lib/date';

interface SessionDetailProps {
  session: SessionWithMessages;
}

export function SessionDetail({ session }: SessionDetailProps) {
  return (
    <div>
      <div className="mb-6 rounded-xl border border-border-default bg-surface p-5">
        <div className="flex items-center gap-3">
          <Avatar src={session.userAvatarUrl} name={session.userName ?? 'User'} />
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{session.title}</h2>
            <p className="text-sm text-text-tertiary">
              {session.userName} &middot; {formatDate(session.createdAt)}
            </p>
          </div>
          <Badge variant="info" className="ml-auto">
            {session.source.replace('_', ' ')}
          </Badge>
        </div>

        {(session.filePaths.length > 0 || session.branch) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {session.branch && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-medium text-purple-400">
                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z" />
                </svg>
                {session.branch}
              </span>
            )}
            {session.filePaths.map((path) => (
              <span
                key={path}
                className="rounded bg-surface-hover px-2 py-0.5 text-xs text-text-tertiary font-mono"
              >
                {path}
              </span>
            ))}
          </div>
        )}
      </div>

      <MessageThread messages={session.messages} />
    </div>
  );
}
