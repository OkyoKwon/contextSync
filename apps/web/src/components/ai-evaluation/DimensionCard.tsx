import type { AiEvaluationDimensionDetail, EvaluationPerspective } from '@context-sync/shared';
import { PERSPECTIVE_DIMENSION_LABELS } from '@context-sync/shared';
import { Card } from '../ui/Card';
import type { EvalContentLang } from './EvalLanguageToggle';

interface DimensionCardProps {
  dimension: AiEvaluationDimensionDetail;
  perspective?: EvaluationPerspective;
  contentLang?: EvalContentLang;
}

export function DimensionCard({
  dimension,
  perspective = 'claude',
  contentLang = 'en',
}: DimensionCardProps) {
  const labels = PERSPECTIVE_DIMENSION_LABELS[perspective];
  const isKo = contentLang === 'ko';

  const summary = isKo ? (dimension.summaryKo ?? dimension.summary) : dimension.summary;
  const strengths = isKo ? (dimension.strengthsKo ?? dimension.strengths) : dimension.strengths;
  const weaknesses = isKo ? (dimension.weaknessesKo ?? dimension.weaknesses) : dimension.weaknesses;
  const suggestions = isKo
    ? (dimension.suggestionsKo ?? dimension.suggestions)
    : dimension.suggestions;

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          {labels[dimension.dimension] ?? dimension.dimension}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-text-primary">{dimension.score}</span>
          <span className="text-xs text-text-tertiary">({dimension.confidence}% confidence)</span>
        </div>
      </div>
      <p className="mb-3 text-sm text-text-secondary">{summary}</p>

      {strengths.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-xs font-medium text-green-400">Strengths</p>
          <ul className="space-y-1">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                <span className="mt-0.5 text-green-400">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {weaknesses.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-xs font-medium text-red-400">Weaknesses</p>
          <ul className="space-y-1">
            {weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                <span className="mt-0.5 text-red-400">-</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-blue-400">Suggestions</p>
          <ul className="space-y-1">
            {suggestions.map((s, i) => (
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
