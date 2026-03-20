import type { SessionSource } from '@context-sync/shared';
import { Button } from '../ui/Button';
import { InfoIcon } from '../ui/icons';

interface TimelineFiltersProps {
  readonly activeSource: SessionSource | null;
  readonly onFilterChange: (source: SessionSource | null) => void;
}

const filters: readonly { readonly label: string; readonly value: SessionSource | null; readonly description: string }[] = [
  { label: 'All', value: null, description: 'Show all sessions' },
  { label: 'Claude Code', value: 'claude_code', description: 'Sessions from the Claude Code CLI' },
  { label: 'Claude AI', value: 'claude_ai', description: 'Sessions from claude.ai web' },
  { label: 'API', value: 'api', description: 'Sessions created via API calls' },
  { label: 'Manual', value: 'manual', description: 'Manually added sessions' },
];

export function TimelineFilters({ activeSource, onFilterChange }: TimelineFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {filters.map(({ label, value }) => (
        <Button
          key={label}
          variant={activeSource === value ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onFilterChange(value)}
        >
          {label}
        </Button>
      ))}
      <div className="group relative">
        <InfoIcon size={14} className="cursor-help text-text-tertiary transition-colors group-hover:text-text-secondary" />
        <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border-primary bg-bg-primary p-3 opacity-0 shadow-xl backdrop-blur-sm transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Filter by source
          </p>
          <ul className="space-y-1.5">
            {filters.map(({ label, description }) => (
              <li key={label} className="text-xs">
                <span className="font-medium text-text-primary">{label}</span>
                <span className="text-text-tertiary"> — {description}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
