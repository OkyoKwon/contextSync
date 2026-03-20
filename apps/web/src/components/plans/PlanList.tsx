import { useState, useMemo } from 'react';
import type { PlanSummary } from '@context-sync/shared';
import { Badge } from '../ui/Badge';

interface PlanListProps {
  readonly plans: readonly PlanSummary[];
  readonly selectedFilename: string | null;
  readonly onSelect: (filename: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getProjectLabel(directory: string): string {
  const parts = directory.split('/');
  return parts[parts.length - 1] || directory;
}

export function PlanList({ plans, selectedFilename, onSelect }: PlanListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return plans;

    const query = search.toLowerCase();
    return plans.filter(
      (p) => p.title.toLowerCase().includes(query) || p.filename.toLowerCase().includes(query),
    );
  }, [plans, search]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-border-default p-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search plans..."
          className="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-blue-500 focus:outline-none"
        />
        <p className="text-xs text-text-tertiary">
          {filtered.length} plan{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((plan) => (
          <button
            key={plan.filename}
            onClick={() => onSelect(plan.filename)}
            className={`w-full border-b border-border-default px-4 py-3 text-left transition-colors hover:bg-interactive-hover ${
              selectedFilename === plan.filename
                ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
                : ''
            }`}
          >
            <p className="truncate text-sm font-medium text-text-primary">{plan.title}</p>
            {plan.projects.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {plan.projects.map((proj) => (
                  <Badge key={proj.projectDirectory} variant={proj.projectId ? 'info' : 'default'}>
                    {proj.projectName ?? getProjectLabel(proj.projectDirectory)}
                  </Badge>
                ))}
              </div>
            )}
            <div className="mt-1 flex items-center gap-2 text-xs text-text-tertiary">
              <span>{formatDate(plan.lastModifiedAt)}</span>
              <span>·</span>
              <span>{formatFileSize(plan.sizeBytes)}</span>
            </div>
            <p className="mt-0.5 truncate text-xs text-text-tertiary">{plan.filename}</p>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-text-tertiary">
            {search ? 'No plans match your search' : 'No plans found'}
          </div>
        )}
      </div>
    </div>
  );
}
