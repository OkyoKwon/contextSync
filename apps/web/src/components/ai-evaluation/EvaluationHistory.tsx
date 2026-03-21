import type { AiEvaluationHistoryEntry } from '@context-sync/shared';
import { Badge } from '../ui/Badge';
import { ProficiencyBadge } from './ProficiencyBadge';

interface EvaluationHistoryProps {
  entries: readonly AiEvaluationHistoryEntry[];
  onSelectEvaluation: (evaluationId: string) => void;
}

export function EvaluationHistory({ entries, onSelectEvaluation }: EvaluationHistoryProps) {
  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-text-tertiary">No evaluation history yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <button
          key={entry.id}
          onClick={() => onSelectEvaluation(entry.id)}
          className="flex w-full items-center justify-between rounded-lg border border-border-default bg-surface-hover p-3 text-left transition-colors hover:border-blue-500/30"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">
                {entry.overallScore != null ? entry.overallScore.toFixed(1) : '-'}
              </span>
              <ProficiencyBadge tier={entry.proficiencyTier} />
              {entry.status !== 'completed' && (
                <Badge variant={entry.status === 'failed' ? 'critical' : 'warning'}>
                  {entry.status}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-text-tertiary">
              {entry.sessionsAnalyzed} sessions, {entry.messagesAnalyzed} messages
            </p>
          </div>
          <div className="text-right text-xs text-text-tertiary">
            <p>{new Date(entry.createdAt).toLocaleDateString()}</p>
            <p>
              {new Date(entry.dateRangeStart).toLocaleDateString()} –{' '}
              {new Date(entry.dateRangeEnd).toLocaleDateString()}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
