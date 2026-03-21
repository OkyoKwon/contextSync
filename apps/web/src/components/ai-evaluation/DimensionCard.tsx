import type { AiEvaluationDimensionDetail } from '@context-sync/shared';
import { DIMENSION_LABELS } from '@context-sync/shared';
import { Card } from '../ui/Card';

interface DimensionCardProps {
  dimension: AiEvaluationDimensionDetail;
}

export function DimensionCard({ dimension }: DimensionCardProps) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          {DIMENSION_LABELS[dimension.dimension] ?? dimension.dimension}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-text-primary">{dimension.score}</span>
          <span className="text-xs text-text-tertiary">({dimension.confidence}% confidence)</span>
        </div>
      </div>
      <p className="mb-3 text-sm text-text-secondary">{dimension.summary}</p>

      {dimension.strengths.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-xs font-medium text-green-400">Strengths</p>
          <ul className="space-y-1">
            {dimension.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                <span className="mt-0.5 text-green-400">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {dimension.weaknesses.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-xs font-medium text-red-400">Weaknesses</p>
          <ul className="space-y-1">
            {dimension.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                <span className="mt-0.5 text-red-400">-</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {dimension.suggestions.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-blue-400">Suggestions</p>
          <ul className="space-y-1">
            {dimension.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                <span className="mt-0.5 text-blue-400">*</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
