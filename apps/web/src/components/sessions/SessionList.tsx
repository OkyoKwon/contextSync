import type { Session } from '@context-sync/shared';
import { SessionCard } from './SessionCard';
import { Spinner } from '../ui/Spinner';

interface SessionListProps {
  sessions: readonly Session[];
  isLoading: boolean;
}

export function SessionList({ sessions, isLoading }: SessionListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[#A1A1AA]">
        No sessions yet. Upload a session to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  );
}
