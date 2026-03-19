import { useState } from 'react';
import { useSessions } from '../hooks/use-sessions';
import { SessionList } from '../components/sessions/SessionList';
import { SessionSyncModal } from '../components/sessions/SessionSyncModal';
import { Button } from '../components/ui/Button';

export function SessionsPage() {
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const { data, isLoading } = useSessions();

  const sessions = data?.data ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Sessions</h1>
        <Button onClick={() => setIsSyncOpen(true)}>Sync Session</Button>
      </div>

      <SessionList sessions={sessions} isLoading={isLoading} />

      <SessionSyncModal isOpen={isSyncOpen} onClose={() => setIsSyncOpen(false)} />
    </div>
  );
}
