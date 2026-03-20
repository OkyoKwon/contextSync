import { Link } from 'react-router';
import { useConflicts } from '../../hooks/use-conflicts';
import { SeverityBadge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { CheckCircleIcon } from '../ui/icons';

export function ActiveConflictsSidebar() {
  const { data, isLoading } = useConflicts({ status: 'detected' });
  const conflicts = data?.data ?? [];

  return (
    <div className="rounded-xl border border-border-default bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">Active Conflicts</h3>

      {isLoading && <Spinner size="sm" />}

      {!isLoading && conflicts.length === 0 && (
        <div className="flex items-center gap-2">
          <CheckCircleIcon size={16} className="text-green-400" />
          <p className="text-xs text-text-secondary">All clear — no conflicts detected</p>
        </div>
      )}

      <div className="space-y-2">
        {conflicts.slice(0, 5).map((conflict) => (
          <Link
            key={conflict.id}
            to={`/conflicts`}
            className="block rounded-lg border border-border-default p-2 hover:bg-surface-hover"
          >
            <div className="flex items-center gap-2">
              <SeverityBadge severity={conflict.severity} />
              <span className="text-xs text-text-secondary line-clamp-1">{conflict.description}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
