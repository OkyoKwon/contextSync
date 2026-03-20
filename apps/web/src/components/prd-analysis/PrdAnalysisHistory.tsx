import { useState } from 'react';
import type { PrdAnalysisHistoryEntry } from '@context-sync/shared';
import { usePrdAnalysisHistory } from '../../hooks/use-prd-analysis';

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
    return (
      <div className="py-8 text-center text-sm text-text-tertiary">Loading history...</div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-tertiary">
        No analysis history yet. Upload a PRD and run your first analysis.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.length >= 2 && <HistoryChart entries={entries as PrdAnalysisHistoryEntry[]} />}

      <div className="overflow-hidden rounded-lg border border-border-default">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default bg-surface-overlay">
              <th className="px-4 py-2 text-left font-medium text-text-tertiary">Document</th>
              <th className="px-4 py-2 text-left font-medium text-text-tertiary">Status</th>
              <th className="px-4 py-2 text-right font-medium text-text-tertiary">Rate</th>
              <th className="px-4 py-2 text-right font-medium text-text-tertiary">Items</th>
              <th className="px-4 py-2 text-right font-medium text-text-tertiary">Date</th>
            </tr>
          </thead>
          <tbody>
            {(entries as readonly PrdAnalysisHistoryEntry[]).map((entry) => (
              <tr
                key={entry.id}
                onClick={() => entry.status === 'completed' && onSelectAnalysis(entry.id)}
                className={`border-b border-border-default last:border-0 ${
                  entry.status === 'completed' ? 'cursor-pointer hover:bg-surface-overlay' : ''
                }`}
              >
                <td className="px-4 py-2 text-text-primary">{entry.documentTitle}</td>
                <td className="px-4 py-2">{getStatusBadge(entry.status)}</td>
                <td className={`px-4 py-2 text-right font-medium ${getRateColor(entry.overallRate)}`}>
                  {entry.overallRate !== null ? `${entry.overallRate.toFixed(1)}%` : '-'}
                </td>
                <td className="px-4 py-2 text-right text-text-tertiary">
                  {entry.totalItems > 0 ? `${entry.achievedItems}/${entry.totalItems}` : '-'}
                </td>
                <td className="px-4 py-2 text-right text-text-tertiary">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
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

function HistoryChart({ entries }: { readonly entries: readonly PrdAnalysisHistoryEntry[] }) {
  const completedEntries = entries
    .filter((e) => e.status === 'completed' && e.overallRate !== null)
    .reverse();

  if (completedEntries.length < 2) return null;

  const maxRate = 100;
  const chartWidth = 600;
  const chartHeight = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 40 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const points = completedEntries.map((entry, i) => {
    const x = padding.left + (i / (completedEntries.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - ((entry.overallRate ?? 0) / maxRate) * innerHeight;
    return { x, y, rate: entry.overallRate ?? 0, date: entry.createdAt };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="overflow-hidden rounded-lg border border-border-default bg-surface p-4">
      <h4 className="mb-2 text-xs font-medium text-text-tertiary">Achievement Rate Trend</h4>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = padding.top + innerHeight - (v / maxRate) * innerHeight;
          return (
            <g key={v}>
              <line x1={padding.left} x2={chartWidth - padding.right} y1={y} y2={y} stroke="currentColor" className="text-border-default" strokeWidth={0.5} />
              <text x={padding.left - 4} y={y + 3} textAnchor="end" className="fill-text-tertiary text-[8px]">{v}%</text>
            </g>
          );
        })}

        {/* Line */}
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2} />

        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#3b82f6" />
        ))}

        {/* Date labels */}
        {points
          .filter((_, i) => i === 0 || i === points.length - 1)
          .map((p, i) => (
            <text key={i} x={p.x} y={chartHeight - 4} textAnchor="middle" className="fill-text-tertiary text-[7px]">
              {new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </text>
          ))}
      </svg>
    </div>
  );
}
