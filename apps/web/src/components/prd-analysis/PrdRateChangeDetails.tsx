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

export function computeStatusChanges(
  current: readonly PrdRequirement[],
  previous: readonly PrdRequirement[],
): readonly StatusChange[] {
  const previousMap = new Map(
    previous.map((r) => [r.requirementText, r.status]),
  );

  return current
    .filter((r) => {
      const prevStatus = previousMap.get(r.requirementText);
      return prevStatus !== undefined && prevStatus !== r.status;
    })
    .map((r) => ({
      requirementText: r.requirementText,
      from: previousMap.get(r.requirementText)!,
      to: r.status,
    }));
}

function StatusBadge({ status }: { readonly status: PrdRequirementStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${config.bgClass} ${config.textClass}`}>
      {config.label}
    </span>
  );
}

export function PrdRateChangeDetails({ currentRequirements, previousRequirements }: PrdRateChangeDetailsProps) {
  const [expanded, setExpanded] = useState(false);

  const changes = computeStatusChanges(currentRequirements, previousRequirements);

  if (changes.length === 0) return null;

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
        </div>
      )}
    </div>
  );
}
