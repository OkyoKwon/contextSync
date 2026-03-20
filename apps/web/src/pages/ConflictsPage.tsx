import { useState } from 'react';
import type { ConflictSeverity, ConflictStatus } from '@context-sync/shared';
import { useConflicts } from '../hooks/use-conflicts';
import { useRequireProject } from '../hooks/use-require-project';
import { ConflictList } from '../components/conflicts/ConflictList';
import { NoProjectState } from '../components/shared/NoProjectState';
import { PageBreadcrumb } from '../components/layout/PageBreadcrumb';
import { Spinner } from '../components/ui/Spinner';

export function ConflictsPage() {
  const { isProjectSelected, isLoading: isProjectLoading } = useRequireProject();
  const [severity, setSeverity] = useState<ConflictSeverity | undefined>();
  const [status, setStatus] = useState<ConflictStatus | undefined>();

  const { data, isLoading } = useConflicts({ severity, status });
  const conflicts = data?.data ?? [];

  if (isProjectLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
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

  return (
    <div>
      <div className="mb-6">
        <PageBreadcrumb pageName="Conflicts" />
      </div>

      <div className="mb-4 flex gap-3">
        <select
          value={severity ?? ''}
          onChange={(e) => setSeverity((e.target.value || undefined) as ConflictSeverity | undefined)}
          className="rounded-lg border border-border-input bg-page px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>

        <select
          value={status ?? ''}
          onChange={(e) => setStatus((e.target.value || undefined) as ConflictStatus | undefined)}
          className="rounded-lg border border-border-input bg-page px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="">All Statuses</option>
          <option value="detected">Detected</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      <ConflictList conflicts={conflicts} isLoading={isLoading} />
    </div>
  );
}
