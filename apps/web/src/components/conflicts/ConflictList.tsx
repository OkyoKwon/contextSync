import type { Conflict } from '@context-sync/shared';
import { ConflictCard } from './ConflictCard';
import { Spinner } from '../ui/Spinner';

interface ConflictListProps {
  conflicts: readonly Conflict[];
  isLoading: boolean;
}

export function ConflictList({ conflicts, isLoading }: ConflictListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (conflicts.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[#A1A1AA]">
        No conflicts detected. Your team is in sync!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conflicts.map((conflict) => (
        <ConflictCard key={conflict.id} conflict={conflict} />
      ))}
    </div>
  );
}
