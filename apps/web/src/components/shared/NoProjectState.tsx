import { useState } from 'react';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { CreateProjectModal } from '../projects/CreateProjectModal';

interface NoProjectStateProps {
  readonly pageName: string;
}

export function NoProjectState({ pageName }: NoProjectStateProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

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
        description={`Create a project to start using ${pageName}.`}
        action={<Button onClick={() => setShowCreateModal(true)}>Create Project</Button>}
      />
      <CreateProjectModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
}
