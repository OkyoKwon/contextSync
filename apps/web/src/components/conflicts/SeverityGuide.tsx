import { SEVERITY_THRESHOLDS, CONFLICT_DETECTION_WINDOW_DAYS } from '@context-sync/shared';
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
  return (
    <div className="mb-4 rounded-xl border border-border-default bg-surface px-5 py-3.5">
      <div className="flex items-center gap-6">
        <h4 className="shrink-0 text-xs font-medium text-text-secondary">Severity Guide</h4>

        <div className="grid flex-1 grid-cols-3 gap-4">
          {GUIDE_ITEMS.map((item) => (
            <div key={item.severity} className="flex items-center gap-2.5">
              <SeverityBadge severity={item.severity} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-primary">{item.label}</p>
                <p className="text-[11px] text-text-tertiary">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="shrink-0 text-[11px] text-text-tertiary">
          Based on overlapping files within {CONFLICT_DETECTION_WINDOW_DAYS}-day window
        </p>
      </div>
    </div>
  );
}
