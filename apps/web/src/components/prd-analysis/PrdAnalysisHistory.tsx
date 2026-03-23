import { useState } from 'react';
import type { PrdAnalysisHistoryEntry } from '@context-sync/shared';
import { usePrdAnalysisHistory } from '../../hooks/use-prd-analysis';
import { EmptyState } from '../ui/EmptyState';
import { PrdRateDelta } from './PrdRateDelta';

interface PrdAnalysisHistoryProps {
  readonly onSelectAnalysis: (analysisId: string) => void;
}

function getRateColor(rate: number | null): string {
  if (rate === null) return 'text-text-tertiary';
  if (rate >= 67) return 'text-green-400';
  if (rate >= 34) return 'text-amber-400';
  return 'text-red-400';
}

function getStatusBadge(status: string) {
  const config: Record<string, { label: string; className: string }> = {
    completed: { label: 'Completed', className: 'bg-green-500/10 text-green-400' },
    failed: { label: 'Failed', className: 'bg-red-500/10 text-red-400' },
    analyzing: { label: 'Analyzing', className: 'bg-blue-500/10 text-blue-400' },
    pending: { label: 'Pending', className: 'bg-surface-overlay text-text-tertiary' },
  };
  const c = config[status] ?? config['pending']!;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c!.className}`}>
      {c!.label}
    </span>
  );
}

export function PrdAnalysisHistory({ onSelectAnalysis }: PrdAnalysisHistoryProps) {
  const [page, setPage] = useState(1);
  const { data: historyData, isLoading } = usePrdAnalysisHistory(page);

  const entries = historyData?.data ?? [];
  const meta = historyData?.meta;

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-text-tertiary">Loading history...</div>;
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        className="!py-12"
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
        title="No analysis history"
        description="Analysis results will appear here after you upload a PRD and run your first analysis."
      />
    );
  }

  const completedEntries = (entries as readonly PrdAnalysisHistoryEntry[]).filter(
    (e) => e.status === 'completed' && e.overallRate !== null,
  );
  const deltaMap = new Map<string, number | null>();
  completedEntries.forEach((entry, i) => {
    if (i === completedEntries.length - 1) {
      deltaMap.set(entry.id, null);
    } else {
      const prev = completedEntries[i + 1]!;
      deltaMap.set(entry.id, (entry.overallRate ?? 0) - (prev.overallRate ?? 0));
    }
  });

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-border-default">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default bg-surface-overlay">
              <th className="px-4 py-2 text-left font-medium text-text-tertiary">Document</th>
              <th className="px-4 py-2 text-left font-medium text-text-tertiary">Status</th>
              <th className="px-4 py-2 text-right font-medium text-text-tertiary">Rate</th>
              <th className="px-4 py-2 text-right font-medium text-text-tertiary">Delta</th>
              <th className="px-4 py-2 text-right font-medium text-text-tertiary">Items</th>
              <th className="px-4 py-2 text-right font-medium text-text-tertiary">Date</th>
            </tr>
          </thead>
          <tbody>
            {(entries as readonly PrdAnalysisHistoryEntry[]).map((entry) => {
              const delta = deltaMap.get(entry.id);
              return (
                <tr
                  key={entry.id}
                  onClick={() => entry.status === 'completed' && onSelectAnalysis(entry.id)}
                  className={`border-b border-border-default last:border-0 ${
                    entry.status === 'completed' ? 'cursor-pointer hover:bg-surface-overlay' : ''
                  }`}
                >
                  <td className="px-4 py-2 text-text-primary">{entry.documentTitle}</td>
                  <td className="px-4 py-2">{getStatusBadge(entry.status)}</td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${getRateColor(entry.overallRate)}`}
                  >
                    {entry.overallRate !== null ? `${entry.overallRate.toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {entry.overallRate !== null && delta !== undefined ? (
                      <PrdRateDelta
                        currentRate={entry.overallRate}
                        previousRate={delta !== null ? entry.overallRate - delta : null}
                      />
                    ) : (
                      <span className="text-text-tertiary">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-text-tertiary">
                    {entry.totalItems > 0 ? `${entry.achievedItems}/${entry.totalItems}` : '-'}
                  </td>
                  <td className="px-4 py-2 text-right text-text-tertiary">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded px-3 py-1 text-sm text-text-secondary hover:bg-surface-overlay disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-text-tertiary">
            Page {page} of {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= meta.totalPages}
            className="rounded px-3 py-1 text-sm text-text-secondary hover:bg-surface-overlay disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
