import { useNavigate } from 'react-router';
import { Button } from '../ui/Button';

interface TeamSetupCtaProps {
  readonly hasCollaborators: boolean;
}

export function TeamSetupCta({ hasCollaborators }: TeamSetupCtaProps) {
  const navigate = useNavigate();

  if (hasCollaborators) return null;

  return (
    <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
      <div className="flex items-start gap-3">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-400">Remote database connected</p>
          <p className="mt-1 text-sm text-text-tertiary">
            Ready to collaborate? Invite team members to share this project.
          </p>
          <Button size="sm" className="mt-3" onClick={() => navigate('/settings?tab=team')}>
            Invite Team &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
