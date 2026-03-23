import { useState, useEffect } from 'react';
import type { RateLimitSnapshot, PlanDetectionSource } from '@context-sync/shared';
import { CLAUDE_PLAN_LABELS } from '@context-sync/shared';
import { useQuotaStatus, useDetectPlan } from '../../hooks/use-quota';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { Tooltip } from '../ui/Tooltip';
import { CrownIcon, ZapIcon } from '../ui/icons';

const SOURCE_LABELS: Record<PlanDetectionSource, string> = {
  'rate-limit': 'via API',
  cli: 'via CLI',
  manual: 'Manual',
};

function formatResetTime(resetIso: string | null): string {
  if (!resetIso) return '--';
  const resetDate = new Date(resetIso);
  const diffMs = resetDate.getTime() - Date.now();
  if (diffMs <= 0) return 'Now';
  const minutes = Math.ceil(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatNumber(value: number | null): string {
  if (value === null) return '--';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function calcPercent(remaining: number | null, limit: number | null): number | null {
  if (remaining === null || limit === null || limit === 0) return null;
  return Math.round((remaining / limit) * 100);
}

interface ProgressBarProps {
  readonly label: string;
  readonly remaining: number | null;
  readonly limit: number | null;
  readonly resetTime: string | null;
}

function ProgressBar({ label, remaining, limit, resetTime }: ProgressBarProps) {
  const pct = calcPercent(remaining, limit);
  const barColor =
    pct === null
      ? 'bg-surface-hover'
      : pct > 50
        ? 'bg-emerald-500'
        : pct > 20
          ? 'bg-amber-500'
          : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary font-medium">{label}</span>
        <span className="text-text-tertiary">
          {pct !== null ? (
            <>
              {formatNumber(remaining)} / {formatNumber(limit)}
              <span className="ml-1.5 text-text-quaternary">
                resets {formatResetTime(resetTime)}
              </span>
            </>
          ) : (
            'No data'
          )}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
        {pct !== null && (
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
}

function ResetCountdown({ snapshot }: { readonly snapshot: RateLimitSnapshot }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const earliestReset = [
    snapshot.requestsReset,
    snapshot.tokensReset,
    snapshot.inputTokensReset,
    snapshot.outputTokensReset,
  ]
    .filter(Boolean)
    .sort()[0];

  if (!earliestReset) return null;

  return (
    <span className="text-xs text-text-tertiary">Next reset: {formatResetTime(earliestReset)}</span>
  );
}

export function QuotaPanel() {
  const { data, isLoading } = useQuotaStatus();
  const detectPlan = useDetectPlan();

  const status = data?.data;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-secondary">API Quota</h2>
          <Tooltip
            content="Rate limits captured from Anthropic API responses during PRD analysis or AI evaluation."
            position="bottom"
          />
        </div>
        <div className="flex items-center gap-2">
          {status?.snapshot && <ResetCountdown snapshot={status.snapshot} />}
          <button
            onClick={() => detectPlan.mutate()}
            disabled={detectPlan.isPending}
            className="rounded-md px-2 py-0.5 text-xs text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {detectPlan.isPending ? 'Detecting...' : 'Refresh Plan'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : status ? (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-emerald-500/5">
            <div className="flex items-center gap-2 mb-1">
              <CrownIcon size={16} className="text-emerald-400" />
              <p className="text-xs font-medium uppercase text-text-tertiary">Detected Plan</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {CLAUDE_PLAN_LABELS[status.inferredPlan] ?? status.inferredPlan}
            </p>
            <span className="mt-1 inline-block rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-text-tertiary">
              {SOURCE_LABELS[status.detectionSource]}
            </span>
          </Card>

          <Card className="col-span-2 bg-violet-500/5">
            <div className="flex items-center gap-2 mb-3">
              <ZapIcon size={16} className="text-violet-400" />
              <p className="text-xs font-medium uppercase text-text-tertiary">Remaining Quota</p>
            </div>
            {status.snapshot ? (
              <div className="space-y-2.5">
                <ProgressBar
                  label="Requests"
                  remaining={status.snapshot.requestsRemaining}
                  limit={status.snapshot.requestsLimit}
                  resetTime={status.snapshot.requestsReset}
                />
                <ProgressBar
                  label="Tokens"
                  remaining={status.snapshot.tokensRemaining}
                  limit={status.snapshot.tokensLimit}
                  resetTime={status.snapshot.tokensReset}
                />
                <ProgressBar
                  label="Input Tokens"
                  remaining={status.snapshot.inputTokensRemaining}
                  limit={status.snapshot.inputTokensLimit}
                  resetTime={status.snapshot.inputTokensReset}
                />
                <ProgressBar
                  label="Output Tokens"
                  remaining={status.snapshot.outputTokensRemaining}
                  limit={status.snapshot.outputTokensLimit}
                  resetTime={status.snapshot.outputTokensReset}
                />
              </div>
            ) : (
              <p className="text-xs text-text-tertiary">
                No rate limit data yet. Run a PRD analysis or AI evaluation to capture quota info.
              </p>
            )}
          </Card>
        </div>
      ) : (
        <p className="text-sm text-text-tertiary">Unable to load quota information</p>
      )}
    </div>
  );
}
