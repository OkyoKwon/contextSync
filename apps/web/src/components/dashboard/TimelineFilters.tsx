import type { SessionSource } from '@context-sync/shared';
import { Button } from '../ui/Button';

interface TimelineFiltersProps {
  readonly activeSource: SessionSource | null;
  readonly onFilterChange: (source: SessionSource | null) => void;
}

const filters: readonly { readonly label: string; readonly value: SessionSource | null }[] = [
  { label: 'All', value: null },
  { label: 'Claude Code', value: 'claude_code' },
  { label: 'Claude AI', value: 'claude_ai' },
  { label: 'API', value: 'api' },
  { label: 'Manual', value: 'manual' },
];

export function TimelineFilters({ activeSource, onFilterChange }: TimelineFiltersProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
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
    </div>
  );
}
