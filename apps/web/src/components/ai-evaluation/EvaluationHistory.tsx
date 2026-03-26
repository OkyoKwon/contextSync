import type { EvaluationGroupHistoryEntry, EvaluationPerspective } from '@context-sync/shared';
import { PERSPECTIVE_LABELS } from '@context-sync/shared';
import { Badge } from '../ui/Badge';
import { ModelIcon } from './ModelIcon';

interface EvaluationHistoryProps {
  entries: readonly EvaluationGroupHistoryEntry[];
  onSelectGroup: (groupId: string) => void;
}

const perspectiveColors: Record<EvaluationPerspective, string> = {
  claude: 'text-orange-400',
  chatgpt: 'text-emerald-400',
  gemini: 'text-blue-400',
};

export function EvaluationHistory({ entries, onSelectGroup }: EvaluationHistoryProps) {
  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-text-tertiary">No evaluation history yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const hasAnyFailed = entry.perspectives.some((p) => p.status === 'failed');
        const hasAnyInProgress = entry.perspectives.some(
          (p) => p.status === 'pending' || p.status === 'analyzing',
        );

        return (
          <button
            key={entry.groupId}
            onClick={() => onSelectGroup(entry.groupId)}
            className="flex w-full items-center justify-between rounded-lg border border-border-default bg-surface-hover p-3 text-left transition-colors hover:border-blue-500/30"
          >
            <div>
              <div className="flex items-center gap-3">
                {entry.perspectives.map((p) => {
                  return (
                    <span
                      key={p.perspective}
                      className={`flex items-center gap-1 text-xs ${perspectiveColors[p.perspective]}`}
                    >
                      <ModelIcon perspective={p.perspective} size={14} />
                      <span className="font-medium">{PERSPECTIVE_LABELS[p.perspective]}</span>
                      {p.status === 'completed' && p.overallScore != null ? (
                        <span className="font-bold text-text-primary">
                          {p.overallScore.toFixed(0)}
                        </span>
                      ) : p.status === 'failed' ? (
                        <Badge variant="critical" className="text-[10px]">
                          fail
                        </Badge>
                      ) : (
                        <span className="text-text-tertiary">...</span>
                      )}
                    </span>
                  );
                })}
                {hasAnyFailed && !hasAnyInProgress && (
                  <Badge variant="warning" className="text-[10px]">
                    partial
                  </Badge>
                )}
                {hasAnyInProgress && (
                  <Badge variant="warning" className="text-[10px]">
                    analyzing
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
        );
      })}
    </div>
  );
}
