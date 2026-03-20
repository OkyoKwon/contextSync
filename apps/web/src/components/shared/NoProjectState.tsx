import { useState } from 'react';
import { Button } from '../ui/Button';
import { CreateProjectModal } from '../projects/CreateProjectModal';

interface NoProjectStateProps {
  readonly pageName: string;
}

export function NoProjectState({ pageName }: NoProjectStateProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

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
          Create a project to start using {pageName}.
        </p>
        <div className="mt-6">
          <Button onClick={() => setShowCreateModal(true)}>Create Project</Button>
        </div>
      </div>
      <CreateProjectModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
}
