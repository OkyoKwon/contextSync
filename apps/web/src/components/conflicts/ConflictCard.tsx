import type { Conflict } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { Badge, SeverityBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { timeAgo } from '../../lib/date';
import { useUpdateConflict, useAiVerifyConflict } from '../../hooks/use-conflicts';
import { showToast } from '../../lib/toast';
import { ConflictAiVerdict } from './ConflictAiVerdict';

interface ConflictCardProps {
  conflict: Conflict;
}

const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning'> = {
  detected: 'warning',
  reviewing: 'info',
  resolved: 'success',
  dismissed: 'default',
};

const severityBorderColors: Record<string, string> = {
  critical: 'border-l-red-500',
  warning: 'border-l-yellow-500',
  info: 'border-l-blue-500',
};

export function ConflictCard({ conflict }: ConflictCardProps) {
  const updateMutation = useUpdateConflict();
  const aiVerifyMutation = useAiVerifyConflict();

  const isActive = conflict.status === 'detected' || conflict.status === 'reviewing';
  const hasVerdict = !!conflict.aiVerdict;
  const isFalsePositive = conflict.aiVerdict === 'false_positive';
  const isInactive = conflict.status === 'resolved' || conflict.status === 'dismissed';

  const handleResolve = () => {
    updateMutation.mutate(
      { id: conflict.id, input: { status: 'resolved' } },
      {
        onSuccess: () => showToast.success('Conflict resolved'),
        onError: (err) => showToast.error(err.message),
      },
    );
  };

  const handleDismiss = () => {
    updateMutation.mutate(
      { id: conflict.id, input: { status: 'dismissed' } },
      {
        onSuccess: () => showToast.success('Conflict dismissed'),
        onError: (err) => showToast.error(err.message),
      },
    );
  };

  const handleAiVerify = () => {
    aiVerifyMutation.mutate(conflict.id, {
      onSuccess: () => showToast.success('AI 분석 완료'),
      onError: (err) => showToast.error(err.message),
    });
  };

  const borderColor = severityBorderColors[conflict.severity] ?? 'border-l-zinc-500';

  return (
    <Card className={`border-l-4 ${borderColor} ${isInactive ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={conflict.severity} />
          <Badge variant={statusColors[conflict.status]}>{conflict.status}</Badge>
          {(conflict.sessionAUserName || conflict.sessionBUserName) && (
            <span className="text-xs text-text-muted">
              {conflict.sessionAUserName ?? 'User A'} ↔ {conflict.sessionBUserName ?? 'User B'}
            </span>
          )}
        </div>
        <span className="shrink-0 text-xs text-text-muted">{timeAgo(conflict.createdAt)}</span>
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

      <ConflictAiVerdict conflict={conflict} variant="compact" />

      {isActive && (
        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            variant={hasVerdict ? 'ghost' : 'secondary'}
            onClick={handleAiVerify}
            disabled={aiVerifyMutation.isPending}
            isLoading={aiVerifyMutation.isPending}
          >
            {aiVerifyMutation.isPending ? 'Analyzing...' : hasVerdict ? 'Re-verify' : 'AI Verify'}
          </Button>
          <div className="mx-1 h-4 w-px bg-border-default" />
          <Button
            size="sm"
            onClick={handleResolve}
            disabled={updateMutation.isPending}
            isLoading={updateMutation.isPending}
          >
            Resolve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={updateMutation.isPending}
            isLoading={updateMutation.isPending}
          >
            Dismiss{isFalsePositive ? ' (Suggested)' : ''}
          </Button>
        </div>
      )}
    </Card>
  );
}
