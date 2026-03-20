import type { Conflict } from '@context-sync/shared';
import { SeverityBadge, Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDate } from '../../lib/date';
import { useUpdateConflict } from '../../hooks/use-conflicts';

interface ConflictDetailViewProps {
  conflict: Conflict;
}

export function ConflictDetailView({ conflict }: ConflictDetailViewProps) {
  const updateMutation = useUpdateConflict();

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#1C1C1C] p-6">
      <div className="flex items-center gap-3">
        <SeverityBadge severity={conflict.severity} />
        <Badge>{conflict.conflictType}</Badge>
        <Badge>{conflict.status}</Badge>
        <span className="ml-auto text-sm text-[#A1A1AA]">{formatDate(conflict.createdAt)}</span>
      </div>

      <p className="mt-4 text-sm text-[#D4D4D8]">{conflict.description}</p>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-[#FAFAFA]">Overlapping Files</h4>
        <div className="mt-2 space-y-1">
          {conflict.overlappingPaths.map((path) => (
            <div key={path} className="rounded bg-red-500/10 px-3 py-1.5 text-sm font-mono text-red-400">
              {path}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-zinc-800 p-4">
          <h4 className="text-sm font-medium text-[#FAFAFA]">Session A</h4>
          <p className="mt-1 text-xs text-[#A1A1AA]">ID: {conflict.sessionAId}</p>
          {conflict.sessionATitle && <p className="text-sm">{conflict.sessionATitle}</p>}
        </div>
        <div className="rounded-lg border border-zinc-800 p-4">
          <h4 className="text-sm font-medium text-[#FAFAFA]">Session B</h4>
          <p className="mt-1 text-xs text-[#A1A1AA]">ID: {conflict.sessionBId}</p>
          {conflict.sessionBTitle && <p className="text-sm">{conflict.sessionBTitle}</p>}
        </div>
      </div>

      {(conflict.status === 'detected' || conflict.status === 'reviewing') && (
        <div className="mt-6 flex gap-2">
          <Button
            onClick={() => updateMutation.mutate({ id: conflict.id, input: { status: 'resolved' } })}
            disabled={updateMutation.isPending}
          >
            Mark as Resolved
          </Button>
          <Button
            variant="secondary"
            onClick={() => updateMutation.mutate({ id: conflict.id, input: { status: 'dismissed' } })}
            disabled={updateMutation.isPending}
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
