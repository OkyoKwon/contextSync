import { useNavigate } from 'react-router';
import { Button } from '../ui/Button';

interface EmptyDashboardProps {
  readonly hasProject?: boolean;
  readonly hasSessions?: boolean;
}

export function EmptyDashboard({ hasProject = false, hasSessions = false }: EmptyDashboardProps) {
  const navigate = useNavigate();

  if (hasProject && !hasSessions) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="mb-4 h-12 w-12 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <h2 className="text-lg font-semibold text-text-primary">
          Sync your first session
        </h2>
        <p className="mt-2 max-w-md text-center text-sm text-text-tertiary">
          Your project is ready! Head to the Conversations page to sync your Claude Code sessions and start tracking your work.
        </p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => navigate('/project')}>
            Go to Conversations
          </Button>
          <Button variant="secondary" onClick={() => navigate('/settings/project')}>
            Project Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <svg className="mb-4 h-12 w-12 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      <h2 className="text-lg font-semibold text-text-primary">
        No project selected
      </h2>
      <p className="mt-2 max-w-md text-center text-sm text-text-tertiary">
        Create a personal project to start tracking your sessions, or join a team to collaborate.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => navigate('/settings/project')}>
          Create Personal Project
        </Button>
        <Button variant="secondary" onClick={() => navigate('/settings/team')}>
          Create Team
        </Button>
      </div>
    </div>
  );
}
