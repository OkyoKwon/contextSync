import { useNavigate } from 'react-router';
import { Card } from '../ui/Card';
import { useConflicts } from '../../hooks/use-conflicts';

interface QuickAction {
  readonly label: string;
  readonly description: string;
  readonly to: string;
  readonly icon: React.ReactNode;
  readonly badge?: number;
}

export function QuickActions() {
  const navigate = useNavigate();
  const { data: conflictsData } = useConflicts({ status: 'detected' });
  const conflictCount = conflictsData?.data?.length ?? 0;

  const actions: readonly QuickAction[] = [
    {
      label: 'Sync Sessions',
      description: 'View and sync local Claude Code sessions',
      to: '/project',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
    },
    {
      label: 'View Conflicts',
      description: 'Review and resolve detected conflicts',
      to: '/conflicts',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      ),
      badge: conflictCount,
    },
    {
      label: 'Upload PRD',
      description: 'Track implementation progress against PRDs',
      to: '/prd-analysis',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action) => (
        <Card
          key={action.to}
          padding="sm"
          className="cursor-pointer transition-colors hover:border-blue-500/50 hover:bg-surface-hover"
          onClick={() => navigate(action.to)}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-surface-hover p-2 text-text-tertiary">{action.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-text-primary">{action.label}</p>
                {action.badge != null && action.badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/20 px-1.5 text-xs font-semibold text-red-400">
                    {action.badge}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-text-muted">{action.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
