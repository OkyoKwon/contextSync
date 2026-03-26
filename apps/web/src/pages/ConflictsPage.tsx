import { useState, useMemo } from 'react';
import type { ConflictSeverity, ConflictStatus } from '@context-sync/shared';
import { useConflicts, useBatchResolveConflicts } from '../hooks/use-conflicts';
import { useRequireProject } from '../hooks/use-require-project';
import { useCurrentProject } from '../hooks/use-current-project';
import { ConflictList } from '../components/conflicts/ConflictList';
import { NoProjectState } from '../components/shared/NoProjectState';
import { PageBreadcrumb } from '../components/layout/PageBreadcrumb';
import { ConflictsSkeleton } from '../components/conflicts/ConflictsSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { SeverityGuide } from '../components/conflicts/SeverityGuide';
import { ConflictOverviewPanel } from '../components/conflicts/ConflictOverviewPanel';
import { showToast } from '../lib/toast';

export function ConflictsPage() {
  const { isProjectSelected, isLoading: isProjectLoading } = useRequireProject();
  const { data: projectData } = useCurrentProject();
  const isTeam = projectData?.data?.isTeam ?? false;
  const [severity, setSeverity] = useState<ConflictSeverity | undefined>();
  const [status, setStatus] = useState<ConflictStatus | undefined>();
  const [verdictFilter, setVerdictFilter] = useState<string>('');
  const [period, setPeriod] = useState<string>('7d');

  const since = useMemo(() => {
    if (!period) return undefined;
    const now = new Date();
    const daysMap: Record<string, number> = { '1d': 1, '3d': 3, '7d': 7, '30d': 30 };
    const days = daysMap[period];
    if (!days) return undefined;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
    return d.toISOString();
  }, [period]);

  const { data, isLoading } = useConflicts({ severity, status, since }, { enabled: isTeam });
  const allConflicts = data?.data ?? [];
  const conflicts = verdictFilter
    ? allConflicts.filter((c) =>
        verdictFilter === 'not_analyzed' ? c.aiVerdict === null : c.aiVerdict === verdictFilter,
      )
    : allConflicts;
  const batchResolveMutation = useBatchResolveConflicts();
  const activeCount = conflicts.filter(
    (c) => c.status === 'detected' || c.status === 'reviewing',
  ).length;

  const handleResolveAll = () => {
    batchResolveMutation.mutate('resolved', {
      onSuccess: (res) => showToast.success(`Resolved ${res.data?.count ?? 0} conflict(s)`),
      onError: (err) => showToast.error(err.message),
    });
  };

  if (isProjectLoading) {
    return (
      <div>
        <div className="mb-6">
          <PageBreadcrumb pageName="Conflicts" />
        </div>
        <ConflictsSkeleton />
      </div>
    );
  }

  if (!isProjectSelected) {
    return (
      <div>
        <div className="mb-6">
          <PageBreadcrumb pageName="Conflicts" />
        </div>
        <NoProjectState pageName="Conflicts" />
      </div>
    );
  }

  if (!isTeam) {
    return (
      <div>
        <div className="mb-6">
          <PageBreadcrumb pageName="Conflicts" />
        </div>
        <div className="rounded-xl border border-border-default bg-surface">
          <EmptyState
            icon={
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            }
            title="Team Feature Only"
            description="Conflicts detection is available for team projects only. Switch to a team project to detect and resolve file conflicts between team members."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <PageBreadcrumb pageName="Conflicts" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          value={severity ?? ''}
          onChange={(e) =>
            setSeverity((e.target.value || undefined) as ConflictSeverity | undefined)
          }
          className="w-auto py-1.5"
        >
          <option value="">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </Select>

        <Select
          value={status ?? ''}
          onChange={(e) => setStatus((e.target.value || undefined) as ConflictStatus | undefined)}
          className="w-auto py-1.5"
        >
          <option value="">All Statuses</option>
          <option value="detected">Detected</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </Select>

        <Select
          value={verdictFilter}
          onChange={(e) => setVerdictFilter(e.target.value)}
          className="w-auto py-1.5"
        >
          <option value="">All Verdicts</option>
          <option value="not_analyzed">Not Analyzed</option>
          <option value="real_conflict">Real Conflict</option>
          <option value="likely_conflict">Likely Conflict</option>
          <option value="low_risk">Low Risk</option>
          <option value="false_positive">False Positive</option>
        </Select>

        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-auto py-1.5"
        >
          <option value="1d">Today</option>
          <option value="3d">Last 3 Days</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="">All Time</option>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-text-muted">{conflicts.length} conflicts</span>
          {activeCount > 0 && (
            <Button
              size="sm"
              onClick={handleResolveAll}
              disabled={batchResolveMutation.isPending}
              isLoading={batchResolveMutation.isPending}
            >
              Resolve All ({activeCount})
            </Button>
          )}
        </div>
      </div>

      <SeverityGuide />

      {allConflicts.length >= 2 && <ConflictOverviewPanel conflicts={allConflicts} />}

      <ConflictList conflicts={conflicts} isLoading={isLoading} />
    </div>
  );
}
