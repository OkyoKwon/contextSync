import { useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CreateProjectModal } from '../projects/CreateProjectModal';

const DISMISS_KEY = 'context-sync-setup-dismissed';

export function SetupCompletionBanner() {
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === 'true',
  );
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (currentProjectId !== 'skipped' || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setIsDismissed(true);
  };

  return (
    <>
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text-primary">Complete your setup</h3>
            <p className="mt-1 text-sm text-text-tertiary">
              Create a project to start syncing your Claude Code sessions and collaborating with
              your team.
            </p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              Create Project
            </Button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded p-1 text-text-muted hover:text-text-primary transition-colors"
              aria-label="Dismiss"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </Card>
      <CreateProjectModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
}
