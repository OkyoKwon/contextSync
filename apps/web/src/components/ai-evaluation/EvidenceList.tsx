import type { AiEvaluationEvidence, AiEvaluationDimensionDetail } from '@context-sync/shared';
import { DIMENSION_LABELS } from '@context-sync/shared';
import { Badge } from '../ui/Badge';
import type { ComponentPropsWithoutRef } from 'react';

type BadgeVariant = ComponentPropsWithoutRef<typeof Badge>['variant'];

interface EvidenceListProps {
  evidence: readonly AiEvaluationEvidence[];
  dimensions: readonly AiEvaluationDimensionDetail[];
}

const sentimentVariants: Record<string, BadgeVariant> = {
  positive: 'success',
  negative: 'critical',
  neutral: 'default',
};

export function EvidenceList({ evidence, dimensions }: EvidenceListProps) {
  const dimensionMap = new Map(dimensions.map((d) => [d.id, d]));

  return (
    <div className="space-y-3">
      {evidence.map((item) => {
        const dim = dimensionMap.get(item.dimensionId);
        return (
          <div
            key={item.id}
            className="rounded-lg border border-border-default bg-surface-hover p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              {dim && (
                <span className="text-xs text-text-tertiary">
                  {DIMENSION_LABELS[dim.dimension] ?? dim.dimension}
                </span>
              )}
              <Badge variant={sentimentVariants[item.sentiment] ?? 'default'}>
                {item.sentiment}
              </Badge>
            </div>
            <blockquote className="mb-2 border-l-2 border-blue-500/30 pl-3 text-sm italic text-text-secondary">
              {item.excerpt}
            </blockquote>
            <p className="text-xs text-text-tertiary">{item.annotation}</p>
          </div>
        );
      })}
    </div>
  );
}
