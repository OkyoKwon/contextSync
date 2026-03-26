import { useState } from 'react';
import { SEVERITY_THRESHOLDS } from '@context-sync/shared';
import { SeverityBadge } from '../ui/Badge';

const GUIDE_ITEMS = [
  {
    severity: 'info' as const,
    label: `${SEVERITY_THRESHOLDS.info.minOverlap}–${SEVERITY_THRESHOLDS.info.maxOverlap} overlapping files`,
    description: 'Minor conflict with low impact.',
  },
  {
    severity: 'warning' as const,
    label: `${SEVERITY_THRESHOLDS.warning.minOverlap}–${SEVERITY_THRESHOLDS.warning.maxOverlap} overlapping files`,
    description: 'Needs attention. Review recommended.',
  },
  {
    severity: 'critical' as const,
    label: `${SEVERITY_THRESHOLDS.critical.minOverlap}+ overlapping files`,
    description: 'Resolve immediately. High impact.',
  },
] as const;

export function SeverityGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-lg border border-border-default px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
        Severity Guide
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-border-default bg-surface p-4 shadow-lg">
          <h4 className="mb-3 text-sm font-medium text-text-primary">Severity Classification</h4>
          <div className="space-y-3">
            {GUIDE_ITEMS.map((item) => (
              <div key={item.severity} className="flex items-start gap-3">
                <SeverityBadge severity={item.severity} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-secondary">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-border-default pt-2">
            <p className="text-[11px] text-text-tertiary">
              Severity is determined by the number of overlapping file paths between two sessions
              within a {3}-day detection window.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
