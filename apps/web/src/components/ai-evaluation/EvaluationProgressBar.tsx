import type { EvaluationGroupResult, EvaluationPerspective } from '@context-sync/shared';
import { EVALUATION_PERSPECTIVES, PERSPECTIVE_LABELS } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { ModelIcon } from './ModelIcon';

interface EvaluationProgressBarProps {
  group: EvaluationGroupResult;
}

const GROUP_KEY_MAP: Record<string, keyof EvaluationGroupResult> = {
  claude: 'claude',
  chatgpt: 'chatgpt',
  gemini: 'gemini',
  '4d_framework': 'fourDFramework',
};

export function EvaluationProgressBar({ group }: EvaluationProgressBarProps) {
  const perspectives = EVALUATION_PERSPECTIVES as readonly EvaluationPerspective[];
  const statuses = perspectives.map((p) => {
    const key = GROUP_KEY_MAP[p] ?? p;
    const eval_ = group[key as keyof EvaluationGroupResult];
    return {
      perspective: p,
      status: (eval_ && typeof eval_ === 'object' && 'status' in eval_
        ? eval_.status
        : 'pending') as string,
    };
  });

  const total = statuses.length;
  const completedCount = statuses.filter(
    (s) => s.status === 'completed' || s.status === 'failed',
  ).length;
  const isAllDone = completedCount === total;

  if (isAllDone) return null;

  const progress = Math.round((completedCount / total) * 100);

  return (
    <Card>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-text-primary">Evaluating...</span>
        <span className="text-text-tertiary">
          {completedCount}/{total} done
        </span>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-2 flex items-center gap-4">
        {statuses.map(({ perspective, status }) => (
          <div key={perspective} className="flex items-center gap-1.5 text-xs">
            {status === 'completed' ? (
              <span className="text-green-400">&#10003;</span>
            ) : status === 'failed' ? (
              <span className="text-red-400">&#10007;</span>
            ) : (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border border-text-tertiary border-t-transparent" />
            )}
            <ModelIcon perspective={perspective} size={14} />
            <span className="text-text-secondary">{PERSPECTIVE_LABELS[perspective]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
