import type { EvaluationGroupHistoryEntry } from '@context-sync/shared';
import { PERSPECTIVE_LABELS } from '@context-sync/shared';
import { Badge } from '../ui/Badge';
import { ModelIcon } from './ModelIcon';

interface EvaluationHistoryProps {
  entries: readonly EvaluationGroupHistoryEntry[];
  onSelectGroup: (groupId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
  isDeletingGroupId?: string | null;
}

const perspectiveColors: Record<string, string> = {
  claude: 'text-orange-400',
  chatgpt: 'text-emerald-400',
  gemini: 'text-blue-400',
  '4d_framework': 'text-purple-400',
};

export function EvaluationHistory({
  entries,
  onSelectGroup,
  onDeleteGroup,
  isDeletingGroupId,
}: EvaluationHistoryProps) {
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
        const isDeleting = isDeletingGroupId === entry.groupId;

        return (
          <div
            key={entry.groupId}
            className={`flex w-full items-center justify-between rounded-lg border border-border-default bg-surface-hover p-3 text-left transition-colors ${isDeleting ? 'opacity-50' : ''}`}
          >
            <button
              onClick={() => onSelectGroup(entry.groupId)}
              className="min-w-0 flex-1 text-left transition-colors hover:opacity-80"
              disabled={isDeleting}
            >
              <div className="flex items-center gap-3">
                {entry.perspectives.map((p) => (
                  <span
                    key={p.perspective}
                    className={`flex items-center gap-1 text-xs ${perspectiveColors[p.perspective] ?? 'text-text-tertiary'}`}
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
                ))}
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
            </button>

            <div className="flex items-center gap-3">
              <div className="text-right text-xs text-text-tertiary">
                <p>{new Date(entry.createdAt).toLocaleDateString()}</p>
                <p>
                  {new Date(entry.dateRangeStart).toLocaleDateString()} –{' '}
                  {new Date(entry.dateRangeEnd).toLocaleDateString()}
                </p>
              </div>
              {onDeleteGroup && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isDeleting) return;
                    if (window.confirm('Delete this evaluation? This cannot be undone.')) {
                      onDeleteGroup(entry.groupId);
                    }
                  }}
                  disabled={isDeleting}
                  className="shrink-0 rounded p-1 text-text-tertiary transition-colors hover:bg-red-500/10 hover:text-red-400"
                  title="Delete evaluation"
                >
                  {isDeleting ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border border-text-tertiary border-t-transparent" />
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
