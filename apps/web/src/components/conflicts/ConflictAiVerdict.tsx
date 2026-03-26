import type { Conflict, AiVerdict, AiRecommendation } from '@context-sync/shared';
import { Badge } from '../ui/Badge';
import { timeAgo } from '../../lib/date';

interface ConflictAiVerdictProps {
  conflict: Conflict;
  variant: 'compact' | 'full';
}

const verdictConfig: Record<
  AiVerdict,
  { label: string; variant: 'critical' | 'warning' | 'info' | 'success' }
> = {
  real_conflict: { label: 'Real Conflict', variant: 'critical' },
  likely_conflict: { label: 'Likely Conflict', variant: 'warning' },
  low_risk: { label: 'Low Risk', variant: 'info' },
  false_positive: { label: 'False Positive', variant: 'success' },
};

const recommendationLabels: Record<AiRecommendation, string> = {
  coordinate: 'Coordinate',
  review_together: 'Review Together',
  no_action: 'No Action Needed',
  merge_carefully: 'Merge Carefully',
};

export function ConflictAiVerdict({ conflict, variant }: ConflictAiVerdictProps) {
  if (!conflict.aiVerdict) return null;

  const config = verdictConfig[conflict.aiVerdict];

  if (variant === 'compact') {
    return (
      <div className="mt-2 flex items-start gap-2">
        <Badge variant={config.variant}>{config.label}</Badge>
        {conflict.aiConfidence !== null && (
          <span className="text-xs text-text-muted">({conflict.aiConfidence}%)</span>
        )}
        {conflict.aiSummary && (
          <span className="line-clamp-1 text-xs text-text-secondary">{conflict.aiSummary}</span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-default p-4">
      <h4 className="text-sm font-medium text-text-primary">AI Analysis</h4>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={config.variant}>{config.label}</Badge>
        {conflict.aiConfidence !== null && (
          <span className="text-xs text-text-muted">Confidence: {conflict.aiConfidence}%</span>
        )}
        {conflict.aiOverlapType && (
          <span className="text-xs text-text-muted">
            Overlap: {conflict.aiOverlapType.replace('_', ' ')}
          </span>
        )}
        {conflict.aiAnalyzedAt && (
          <span className="ml-auto text-xs text-text-tertiary">
            {timeAgo(conflict.aiAnalyzedAt)}
          </span>
        )}
      </div>

      {conflict.aiSummary && (
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-text-secondary">{conflict.aiSummary}</p>
        </div>
      )}

      {conflict.aiRiskAreas && conflict.aiRiskAreas.length > 0 && (
        <div className="mt-3">
          <h5 className="text-xs font-medium text-text-muted">Risk Areas</h5>
          <ul className="mt-1 space-y-1">
            {conflict.aiRiskAreas.map((area, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-text-secondary">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}

      {conflict.aiRecommendation && (
        <div className="mt-3 rounded-lg bg-blue-500/5 p-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-blue-400">
              {recommendationLabels[conflict.aiRecommendation]}
            </span>
          </div>
          {conflict.aiRecommendationDetail && (
            <p className="mt-1 text-sm text-text-secondary">{conflict.aiRecommendationDetail}</p>
          )}
        </div>
      )}
    </div>
  );
}
