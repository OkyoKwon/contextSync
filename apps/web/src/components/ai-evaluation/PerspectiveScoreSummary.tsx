import type { EvaluationGroupResult, EvaluationPerspective } from '@context-sync/shared';
import { PERSPECTIVE_LABELS, PERSPECTIVE_TIER_LABELS } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';

interface PerspectiveScoreSummaryProps {
  group: EvaluationGroupResult;
  activePerspective: EvaluationPerspective;
  onSelectPerspective: (p: EvaluationPerspective) => void;
}

const PERSPECTIVES: EvaluationPerspective[] = ['claude', 'chatgpt', 'gemini'];

const perspectiveColors: Record<
  EvaluationPerspective,
  { bg: string; border: string; text: string }
> = {
  claude: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  chatgpt: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  gemini: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
};

export function PerspectiveScoreSummary({
  group,
  activePerspective,
  onSelectPerspective,
}: PerspectiveScoreSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {PERSPECTIVES.map((p) => {
        const evaluation = group[p];
        const colors = perspectiveColors[p];
        const isActive = activePerspective === p;
        const tierLabels = PERSPECTIVE_TIER_LABELS[p];

        return (
          <Card
            key={p}
            className={`cursor-pointer transition-all ${
              isActive ? `${colors.border} ring-1 ring-opacity-50` : 'hover:border-border-hover'
            }`}
            onClick={() => onSelectPerspective(p)}
          >
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
                {PERSPECTIVE_LABELS[p]}
              </span>
            </div>

            {!evaluation ? (
              <p className="mt-2 text-sm text-text-tertiary">—</p>
            ) : evaluation.status === 'analyzing' || evaluation.status === 'pending' ? (
              <div className="mt-2 flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm text-text-tertiary">Analyzing...</span>
              </div>
            ) : evaluation.status === 'failed' ? (
              <div className="mt-2">
                <Badge variant="critical">Failed</Badge>
              </div>
            ) : (
              <div className="mt-2">
                <span className="text-3xl font-bold text-text-primary">
                  {evaluation.overallScore?.toFixed(1) ?? '-'}
                </span>
                {evaluation.proficiencyTier && (
                  <Badge variant="success" className="ml-2">
                    {tierLabels[evaluation.proficiencyTier] ?? evaluation.proficiencyTier}
                  </Badge>
                )}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className={`h-full rounded-full ${colors.bg.replace('/10', '')} opacity-70`}
                    style={{ width: `${evaluation.overallScore ?? 0}%` }}
                  />
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
