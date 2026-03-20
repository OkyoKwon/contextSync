import { Link } from 'react-router';
import { useConflicts } from '../../hooks/use-conflicts';
import { SeverityBadge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';

export function ActiveConflictsSidebar() {
  const { data, isLoading } = useConflicts({ status: 'detected' });
  const conflicts = data?.data ?? [];

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#1C1C1C] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[#FAFAFA]">Active Conflicts</h3>

      {isLoading && <Spinner size="sm" />}

      {!isLoading && conflicts.length === 0 && (
        <p className="text-xs text-[#A1A1AA]">No active conflicts</p>
      )}

      <div className="space-y-2">
        {conflicts.slice(0, 5).map((conflict) => (
          <Link
            key={conflict.id}
            to={`/conflicts`}
            className="block rounded-lg border border-zinc-800 p-2 hover:bg-[#252525]"
          >
            <div className="flex items-center gap-2">
              <SeverityBadge severity={conflict.severity} />
              <span className="text-xs text-[#D4D4D8] line-clamp-1">{conflict.description}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
