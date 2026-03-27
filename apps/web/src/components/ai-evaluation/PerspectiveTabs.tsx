import type { EvaluationPerspective, EvaluationGroupResult } from '@context-sync/shared';
import { PERSPECTIVE_LABELS } from '@context-sync/shared';
import { ModelIcon } from './ModelIcon';

interface PerspectiveTabsProps {
  group: EvaluationGroupResult;
  activePerspective: EvaluationPerspective;
  onSelectPerspective: (p: EvaluationPerspective) => void;
}

/** Model perspectives only — 4D Framework is shown in its own section tab */
const MODEL_PERSPECTIVES: EvaluationPerspective[] = ['claude', 'chatgpt', 'gemini'];

function getGroupEval(group: EvaluationGroupResult, p: EvaluationPerspective) {
  if (p === 'claude') return group.claude;
  if (p === 'chatgpt') return group.chatgpt;
  if (p === 'gemini') return group.gemini;
  if (p === '4d_framework') return group.fourDFramework;
  return null;
}

const tabColors: Record<string, string> = {
  claude: 'border-orange-500 text-orange-400',
  chatgpt: 'border-emerald-500 text-emerald-400',
  gemini: 'border-blue-500 text-blue-400',
};

export function PerspectiveTabs({
  group,
  activePerspective,
  onSelectPerspective,
}: PerspectiveTabsProps) {
  return (
    <div className="flex border-b border-border-default">
      {MODEL_PERSPECTIVES.map((p) => {
        const evaluation = getGroupEval(group, p);
        const isActive = activePerspective === p;
        const score = evaluation?.overallScore;
        const isFailed = evaluation?.status === 'failed';
        const isAnalyzing = evaluation?.status === 'pending' || evaluation?.status === 'analyzing';

        return (
          <button
            key={p}
            onClick={() => onSelectPerspective(p)}
            className={`relative flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? (tabColors[p] ?? '')
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <ModelIcon perspective={p} size={16} />
            {PERSPECTIVE_LABELS[p]}
            {score != null && <span className="text-xs opacity-70">{score.toFixed(0)}</span>}
            {isFailed && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
            )}
            {isAnalyzing && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
