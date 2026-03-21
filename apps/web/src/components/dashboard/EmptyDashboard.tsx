import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
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
      <EmptyState
        icon={
          <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        }
        title="Sync your first session"
        description="Your project is ready! Head to the Conversations page to sync your Claude Code sessions and start tracking your work."
        action={
          <div className="flex gap-3">
            <Button onClick={() => navigate('/project')}>Go to Conversations</Button>
            <Button variant="secondary" onClick={() => navigate('/settings')}>
              Project Settings
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <>
      <EmptyState
        icon={
          <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        }
        title="No project selected"
        description="Create a project to start tracking your sessions and collaborating."
        action={<Button onClick={() => setShowCreateModal(true)}>Create Project</Button>}
      />
      <CreateProjectModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
}
