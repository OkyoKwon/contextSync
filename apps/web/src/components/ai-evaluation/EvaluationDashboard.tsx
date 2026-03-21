import type { AiEvaluationWithDetails } from '@context-sync/shared';
import { DIMENSION_LABELS } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { ProficiencyBadge } from './ProficiencyBadge';
import { DimensionCard } from './DimensionCard';
import { EvidenceList } from './EvidenceList';

interface EvaluationDashboardProps {
  evaluation: AiEvaluationWithDetails;
}

export function EvaluationDashboard({ evaluation }: EvaluationDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Overall Score Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">
              Overall Score
            </h2>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-4xl font-bold text-text-primary">
                {evaluation.overallScore?.toFixed(1) ?? '-'}
              </span>
              <ProficiencyBadge tier={evaluation.proficiencyTier} />
            </div>
          </div>
          <div className="text-right text-xs text-text-tertiary">
            <p>{evaluation.sessionsAnalyzed} sessions analyzed</p>
            <p>{evaluation.messagesAnalyzed} messages analyzed</p>
            <p className="mt-1">
              {new Date(evaluation.dateRangeStart).toLocaleDateString()} –{' '}
              {new Date(evaluation.dateRangeEnd).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Score Bars */}
        <div className="mt-4 space-y-2">
          {evaluation.dimensions.map((dim) => (
            <div key={dim.dimension} className="flex items-center gap-3">
              <span className="w-36 text-xs text-text-secondary">
                {DIMENSION_LABELS[dim.dimension] ?? dim.dimension}
              </span>
              <div className="flex-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className={`h-full rounded-full transition-all ${scoreColor(dim.score)}`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
              </div>
              <span className="w-10 text-right text-xs font-medium text-text-primary">
                {dim.score}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Dimension Details */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {evaluation.dimensions.map((dim) => (
          <DimensionCard key={dim.dimension} dimension={dim} />
        ))}
      </div>

      {/* Evidence */}
      {evaluation.evidence.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
            Evidence
          </h2>
          <EvidenceList evidence={evaluation.evidence} dimensions={evaluation.dimensions} />
        </Card>
      )}

      {/* Improvement Summary */}
      {evaluation.improvementSummary && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
            Improvement Guide
          </h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
            {evaluation.improvementSummary}
          </div>
        </Card>
      )}
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 86) return 'bg-green-500';
  if (score >= 71) return 'bg-emerald-500';
  if (score >= 51) return 'bg-blue-500';
  if (score >= 26) return 'bg-yellow-500';
  return 'bg-red-500';
}
