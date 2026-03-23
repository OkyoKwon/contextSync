import type { ModelUsageBreakdown } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { formatTokenCount } from '../../lib/format';

interface ModelBreakdownTableProps {
  readonly breakdown: readonly ModelUsageBreakdown[];
}

export function ModelBreakdownTable({ breakdown }: ModelBreakdownTableProps) {
  if (breakdown.length === 0) {
    return (
      <Card>
        <p className="text-sm text-text-tertiary text-center py-4">No model usage data</p>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default text-text-tertiary">
            <th className="text-left font-medium px-4 py-2">Model</th>
            <th className="text-right font-medium px-4 py-2">Tokens</th>
            <th className="text-right font-medium px-4 py-2">Messages</th>
            <th className="text-right font-medium px-4 py-2">Share</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((row) => (
            <tr key={row.model} className="border-b border-border-default last:border-0">
              <td className="px-4 py-2 font-medium text-text-primary">{row.model}</td>
              <td className="px-4 py-2 text-right text-text-secondary">
                {formatTokenCount(row.totalTokens)}
              </td>
              <td className="px-4 py-2 text-right text-text-secondary">{row.messageCount}</td>
              <td className="px-4 py-2 text-right text-text-secondary">{row.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
