import { useState } from 'react';
import type { ConflictSeverity, ConflictStatus } from '@context-sync/shared';
import { useConflicts } from '../hooks/use-conflicts';
import { ConflictList } from '../components/conflicts/ConflictList';
import { PageBreadcrumb } from '../components/layout/PageBreadcrumb';

export function ConflictsPage() {
  const [severity, setSeverity] = useState<ConflictSeverity | undefined>();
  const [status, setStatus] = useState<ConflictStatus | undefined>();

  const { data, isLoading } = useConflicts({ severity, status });
  const conflicts = data?.data ?? [];

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
