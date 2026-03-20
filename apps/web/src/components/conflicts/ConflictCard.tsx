import type { Conflict } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { Badge, SeverityBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { timeAgo } from '../../lib/date';
import { useUpdateConflict } from '../../hooks/use-conflicts';

interface ConflictCardProps {
  conflict: Conflict;
}

const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning'> = {
  detected: 'warning',
  reviewing: 'info',
  resolved: 'success',
  dismissed: 'default',
};

export function ConflictCard({ conflict }: ConflictCardProps) {
  const updateMutation = useUpdateConflict();

  const handleResolve = () => {
    updateMutation.mutate({ id: conflict.id, input: { status: 'resolved' } });
  };

  const handleDismiss = () => {
    updateMutation.mutate({ id: conflict.id, input: { status: 'dismissed' } });
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={conflict.severity} />
          <Badge variant={statusColors[conflict.status]}>{conflict.status}</Badge>
        </div>
        <span className="text-xs text-text-muted">{timeAgo(conflict.createdAt)}</span>
      </div>

      <p className="mt-2 text-sm text-text-secondary">{conflict.description}</p>

      {conflict.overlappingPaths.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {conflict.overlappingPaths.map((path) => (
            <span
              key={path}
              className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-mono text-red-400"
            >
              {path}
            </span>
          ))}
        </div>
      )}

      {(conflict.status === 'detected' || conflict.status === 'reviewing') && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={handleResolve} disabled={updateMutation.isPending}>
            Resolve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={updateMutation.isPending}
          >
            Dismiss
          </Button>
        </div>
      )}
    </Card>
  );
}
