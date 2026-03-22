import { Button } from '../../ui/Button';

interface CompletionStepProps {
  readonly onClose: () => void;
}

export function CompletionStep({ onClose }: CompletionStepProps) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
        <svg
          className="h-8 w-8 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-text-primary">Remote Database Connected</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Your project data has been migrated to the remote database. You can now invite
          collaborators to work together on this project.
        </p>
      </div>

      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        <p className="text-sm text-blue-400">
          Go to the Collaborators section below to invite team members.
        </p>
      </div>

      <Button onClick={onClose} className="w-full">
        Done
      </Button>
    </div>
  );
}
