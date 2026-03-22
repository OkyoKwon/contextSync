import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../ui/Button';
import { CreateProjectModal } from '../projects/CreateProjectModal';

interface EmptyDashboardProps {
  readonly hasProject?: boolean;
  readonly hasSessions?: boolean;
}

export function EmptyDashboard({ hasProject = false, hasSessions = false }: EmptyDashboardProps) {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (hasProject && !hasSessions) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg
          className="mb-4 h-14 w-14 text-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-text-primary">Welcome to your project!</h2>
        <p className="mt-2 max-w-md text-center text-sm text-text-tertiary">
          Your project is all set up. Sync your Claude Code sessions from the Conversations page to
          see insights and analytics here.
        </p>

        <div className="mt-6 flex items-start gap-6 text-xs text-text-tertiary">
          <div className="flex flex-col items-center gap-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
              1
            </span>
            <span>Conversations</span>
          </div>
          <span className="mt-2 text-text-quaternary">&rarr;</span>
          <div className="flex flex-col items-center gap-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
              2
            </span>
            <span>Sync sessions</span>
          </div>
          <span className="mt-2 text-text-quaternary">&rarr;</span>
          <div className="flex flex-col items-center gap-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
              3
            </span>
            <span>View insights</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={() => navigate('/project')}>Go to Conversations</Button>
          <Button variant="secondary" onClick={() => navigate('/settings')}>
            Project Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center py-20">
        <svg
          className="mb-4 h-12 w-12 text-text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <h2 className="text-lg font-semibold text-text-primary">No project selected</h2>
        <p className="mt-2 max-w-md text-center text-sm text-text-tertiary">
          Create a project to start tracking your sessions and collaborating.
        </p>
        <div className="mt-6">
          <Button onClick={() => setShowCreateModal(true)}>Create Project</Button>
        </div>
      </div>
      <CreateProjectModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
}
