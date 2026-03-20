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
      <div className="mb-6 rounded-xl border border-zinc-800 bg-[#1C1C1C] p-5">
        <div className="flex items-center gap-3">
          <Avatar src={session.userAvatarUrl} name={session.userName ?? 'User'} />
          <div>
            <h2 className="text-lg font-semibold text-[#FAFAFA]">{session.title}</h2>
            <p className="text-sm text-[#A1A1AA]">
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
              <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-medium text-purple-400">
                {session.branch}
              </span>
            )}
            {session.filePaths.map((path) => (
              <span
                key={path}
                className="rounded bg-[#252525] px-2 py-0.5 text-xs text-[#A1A1AA] font-mono"
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
