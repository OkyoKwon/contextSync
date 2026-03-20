import { useState } from 'react';
import type { PrdRequirement, PrdRequirementStatus } from '@context-sync/shared';

interface PrdRateChangeDetailsProps {
  readonly currentRequirements: readonly PrdRequirement[];
  readonly previousRequirements: readonly PrdRequirement[];
}

interface StatusChange {
  readonly requirementText: string;
  readonly from: PrdRequirementStatus;
  readonly to: PrdRequirementStatus;
}

const STATUS_RANK: Record<PrdRequirementStatus, number> = {
  not_started: 0,
  partial: 1,
  achieved: 2,
};

const STATUS_CONFIG: Record<PrdRequirementStatus, { readonly label: string; readonly bgClass: string; readonly textClass: string }> = {
  achieved: { label: 'Achieved', bgClass: 'bg-green-500/10', textClass: 'text-green-400' },
  partial: { label: 'Partial', bgClass: 'bg-amber-500/10', textClass: 'text-amber-400' },
  not_started: { label: 'Not Started', bgClass: 'bg-red-500/10', textClass: 'text-red-400' },
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function computeStatusChanges(
  current: readonly PrdRequirement[],
  previous: readonly PrdRequirement[],
): readonly StatusChange[] {
  const previousMap = new Map(
    previous.map((r) => [normalizeText(r.requirementText), r.status]),
  );

  return current
    .filter((r) => {
      const prevStatus = previousMap.get(normalizeText(r.requirementText));
      return prevStatus !== undefined && prevStatus !== r.status;
    })
    .map((r) => ({
      requirementText: r.requirementText,
      from: previousMap.get(normalizeText(r.requirementText))!,
      to: r.status,
    }));
}

interface StatusDistribution {
  readonly achieved: number;
  readonly partial: number;
  readonly notStarted: number;
  readonly total: number;
}

function countByStatus(requirements: readonly PrdRequirement[]): StatusDistribution {
  return {
    achieved: requirements.filter((r) => r.status === 'achieved').length,
    partial: requirements.filter((r) => r.status === 'partial').length,
    notStarted: requirements.filter((r) => r.status === 'not_started').length,
    total: requirements.length,
  };
}

function StatusBadge({ status }: { readonly status: PrdRequirementStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${config.bgClass} ${config.textClass}`}>
      {config.label}
    </span>
  );
}

function DeltaIndicator({ value }: { readonly value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
      {isPositive ? '+' : ''}{value}
    </span>
  );
}

function AggregateComparison({
  current,
  previous,
}: {
  readonly current: StatusDistribution;
  readonly previous: StatusDistribution;
}) {
  const rows: readonly { readonly status: PrdRequirementStatus; readonly curr: number; readonly prev: number }[] = [
    { status: 'achieved', curr: current.achieved, prev: previous.achieved },
    { status: 'partial', curr: current.partial, prev: previous.partial },
    { status: 'not_started', curr: current.notStarted, prev: previous.notStarted },
  ];

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-text-tertiary">
        Status distribution ({previous.total} &rarr; {current.total} items)
      </p>
      {rows.map((row) => (
        <div key={row.status} className="flex items-center gap-2 text-xs">
          <StatusBadge status={row.status} />
          <span className="text-text-secondary">{row.prev}</span>
          <span className="text-text-tertiary">&rarr;</span>
          <span className="text-text-secondary">{row.curr}</span>
          <DeltaIndicator value={row.curr - row.prev} />
        </div>
      ))}
    </div>
  );
}

export function PrdRateChangeDetails({ currentRequirements, previousRequirements }: PrdRateChangeDetailsProps) {
  const [expanded, setExpanded] = useState(false);

  const changes = computeStatusChanges(currentRequirements, previousRequirements);
  const hasPerItemChanges = changes.length > 0;

  const currentDist = countByStatus(currentRequirements);
  const previousDist = countByStatus(previousRequirements);
  const hasAggregateChanges =
    currentDist.achieved !== previousDist.achieved ||
    currentDist.partial !== previousDist.partial ||
    currentDist.notStarted !== previousDist.notStarted;

  if (!hasPerItemChanges && !hasAggregateChanges) return null;

  const improved = changes.filter(
    (c) => STATUS_RANK[c.to] > STATUS_RANK[c.from],
  );
  const regressed = changes.filter(
    (c) => STATUS_RANK[c.to] < STATUS_RANK[c.from],
  );

  return (
    <div>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary transition-colors hover:text-text-secondary"
      >
        <svg
          className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Why did rate change?
      </button>

      {expanded && (
        <div className="mt-2 space-y-3 rounded-lg border border-border-default bg-surface p-3">
          {hasPerItemChanges ? (
            <>
              {improved.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-green-400">
                    &uarr; {improved.length} Improved
                  </p>
                  <ul className="space-y-1">
                    {improved.map((c) => (
                      <li key={c.requirementText} className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="min-w-0 flex-1 truncate">{c.requirementText}</span>
                        <StatusBadge status={c.from} />
                        <span className="text-text-tertiary">&rarr;</span>
                        <StatusBadge status={c.to} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {regressed.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-red-400">
                    &darr; {regressed.length} Regressed
                  </p>
                  <ul className="space-y-1">
                    {regressed.map((c) => (
                      <li key={c.requirementText} className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="min-w-0 flex-1 truncate">{c.requirementText}</span>
                        <StatusBadge status={c.from} />
                        <span className="text-text-tertiary">&rarr;</span>
                        <StatusBadge status={c.to} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <AggregateComparison current={currentDist} previous={previousDist} />
          )}
        </div>
      )}
    </div>
  );
}
