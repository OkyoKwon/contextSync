import { useState } from 'react';
import type { TokenUsagePeriod } from '@context-sync/shared';
import { useTokenUsage, useRecalculateTokens } from '../../hooks/use-sessions';
import { Spinner } from '../ui/Spinner';
import { TokenUsageSummary } from './TokenUsageSummary';
import { ModelBreakdownTable } from './ModelBreakdownTable';
import { DailyUsageChart } from './DailyUsageChart';

const PERIODS: readonly { readonly value: TokenUsagePeriod; readonly label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

export function TokenUsagePanel() {
  const [period, setPeriod] = useState<TokenUsagePeriod>('30d');
  const { data, isLoading } = useTokenUsage(period);
  const recalculate = useRecalculateTokens();

  const stats = data?.data;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-secondary">Token Usage</h2>
          <button
            onClick={() => recalculate.mutate()}
            disabled={recalculate.isPending}
            title="Recalculate token usage from source files"
            className="rounded-md px-2 py-0.5 text-xs text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {recalculate.isPending ? 'Recalculating...' : 'Recalculate'}
          </button>
          {recalculate.isSuccess && recalculate.data?.data && (
            <span className="text-xs text-emerald-400">
              {recalculate.data.data.updatedSessions} sessions updated
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                period === p.value
                  ? 'bg-accent-primary text-white'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : stats ? (
        <div className="space-y-4">
          <TokenUsageSummary stats={stats} />
          {stats.totalMessages > 0 && stats.measuredMessages < stats.totalMessages && (
            <p className="text-xs text-text-tertiary">
              Based on {stats.measuredMessages} of {stats.totalMessages} messages with token data
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <DailyUsageChart dailyUsage={stats.dailyUsage} />
            <ModelBreakdownTable breakdown={stats.modelBreakdown} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-tertiary">No token usage data available</p>
      )}
    </div>
  );
}
