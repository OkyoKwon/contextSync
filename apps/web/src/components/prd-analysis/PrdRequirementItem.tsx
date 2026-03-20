import { useState } from 'react';
import type { PrdRequirement } from '@context-sync/shared';

interface PrdRequirementItemProps {
  readonly requirement: PrdRequirement;
}

const STATUS_CONFIG = {
  achieved: { label: 'Achieved', bgClass: 'bg-green-500/10', textClass: 'text-green-400' },
  partial: { label: 'Partial', bgClass: 'bg-amber-500/10', textClass: 'text-amber-400' },
  not_started: { label: 'Not Started', bgClass: 'bg-red-500/10', textClass: 'text-red-400' },
} as const;

export function PrdRequirementItem({ requirement }: PrdRequirementItemProps) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[requirement.status];

  return (
    <div className="rounded-lg border border-border-default bg-surface">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <svg
          className={`mt-0.5 h-4 w-4 shrink-0 text-text-tertiary transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-text-primary">{requirement.requirementText}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${config.bgClass} ${config.textClass}`}>
              {config.label}
            </span>
            {requirement.category && (
              <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-xs text-text-tertiary">
                {requirement.category}
              </span>
            )}
            <span className="text-xs text-text-tertiary">
              {requirement.confidence}% confidence
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border-default px-4 py-3 pl-11">
          {requirement.evidence && (
            <div className="mb-2">
              <p className="mb-1 text-xs font-medium text-text-tertiary">Evidence</p>
              <p className="text-sm text-text-secondary">{requirement.evidence}</p>
            </div>
          )}
          {requirement.filePaths.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-text-tertiary">Related Files</p>
              <div className="flex flex-wrap gap-1">
                {requirement.filePaths.map((path) => (
                  <span
                    key={path}
                    className="rounded bg-surface-overlay px-2 py-0.5 font-mono text-xs text-text-secondary"
                  >
                    {path}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
