import { Link } from 'react-router';
import { useConflicts } from '../../hooks/use-conflicts';
import { SeverityBadge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';

export function ActiveConflictsSidebar() {
  const { data, isLoading } = useConflicts({ status: 'detected' });
  const conflicts = data?.data ?? [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Active Conflicts</h3>

      {isLoading && <Spinner size="sm" />}

      {!isLoading && conflicts.length === 0 && (
        <p className="text-xs text-gray-500">No active conflicts</p>
      )}

      <div className="space-y-2">
        {conflicts.slice(0, 5).map((conflict) => (
          <Link
            key={conflict.id}
            to={`/conflicts`}
            className="block rounded-lg border border-gray-100 p-2 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <SeverityBadge severity={conflict.severity} />
              <span className="text-xs text-gray-700 line-clamp-1">{conflict.description}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
