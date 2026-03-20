import { useState } from 'react';
import type { PrdRequirement, PrdRequirementStatus } from '@context-sync/shared';
import { PrdRequirementItem } from './PrdRequirementItem';

interface PrdRequirementListProps {
  readonly requirements: readonly PrdRequirement[];
}

type FilterOption = 'all' | PrdRequirementStatus;

const FILTERS: readonly { readonly value: FilterOption; readonly label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'achieved', label: 'Achieved' },
  { value: 'partial', label: 'Partial' },
  { value: 'not_started', label: 'Not Started' },
];

export function PrdRequirementList({ requirements }: PrdRequirementListProps) {
  const [filter, setFilter] = useState<FilterOption>('all');

  const filtered = filter === 'all'
    ? requirements
    : requirements.filter((r) => r.status === filter);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">
          Requirements ({filtered.length})
        </h3>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === f.value
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((req) => (
          <PrdRequirementItem key={req.id} requirement={req} />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-text-tertiary">
            No requirements match this filter
          </p>
        )}
      </div>
    </div>
  );
}
