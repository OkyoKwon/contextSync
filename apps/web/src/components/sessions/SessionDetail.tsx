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
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <Avatar src={session.userAvatarUrl} name={session.userName ?? 'User'} />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{session.title}</h2>
            <p className="text-sm text-gray-500">
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
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                {session.branch}
              </span>
            )}
            {session.filePaths.map((path) => (
              <span
                key={path}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 font-mono"
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
