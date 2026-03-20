import type { PrdAnalysisWithRequirements, PrdRequirement } from '@context-sync/shared';
import { PrdRateDelta } from './PrdRateDelta';
import { PrdRateChangeDetails } from './PrdRateChangeDetails';

interface PrdAnalysisResultsProps {
  readonly analysis: PrdAnalysisWithRequirements;
  readonly previousRate?: number | null;
  readonly previousRequirements?: readonly PrdRequirement[] | null;
}

function getRateColor(rate: number): string {
  if (rate >= 67) return 'text-green-400';
  if (rate >= 34) return 'text-amber-400';
  return 'text-red-400';
}

function getRateBarColor(rate: number): string {
  if (rate >= 67) return 'bg-green-500';
  if (rate >= 34) return 'bg-amber-500';
  return 'bg-red-500';
}

export function PrdAnalysisResults({ analysis, previousRate, previousRequirements }: PrdAnalysisResultsProps) {
  const rate = analysis.overallRate ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Analysis Results</h3>
          <p className="text-sm text-text-tertiary">
            {analysis.documentTitle} &middot; {analysis.scannedFilesCount} files scanned
          </p>
        </div>
        <div className="text-right">
          <p className="mb-0.5 text-xs font-medium uppercase tracking-wider text-text-tertiary">Achievement Rate</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-3xl font-bold ${getRateColor(rate)}`}>
              {rate.toFixed(1)}%
            </p>
            <PrdRateDelta currentRate={rate} previousRate={previousRate ?? null} />
          </div>
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-surface-overlay">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getRateBarColor(rate)}`}
          style={{ width: `${Math.min(100, rate)}%` }}
        />
      </div>

      {previousRequirements && previousRequirements.length > 0 && (
        <PrdRateChangeDetails
          currentRequirements={analysis.requirements}
          previousRequirements={previousRequirements}
        />
      )}

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Achieved"
          count={analysis.achievedItems}
          total={analysis.totalItems}
          colorClass="text-green-400 bg-green-500/10"
        />
        <StatCard
          label="Partial"
          count={analysis.partialItems}
          total={analysis.totalItems}
          colorClass="text-amber-400 bg-amber-500/10"
        />
        <StatCard
          label="Not Started"
          count={analysis.notStartedItems}
          total={analysis.totalItems}
          colorClass="text-red-400 bg-red-500/10"
        />
      </div>

      <div className="flex items-center gap-4 text-xs text-text-tertiary">
        <span>Model: {analysis.modelUsed}</span>
        <span>Tokens: {(analysis.inputTokensUsed + analysis.outputTokensUsed).toLocaleString()}</span>
        {analysis.completedAt && (
          <span>Completed: {new Date(analysis.completedAt).toLocaleString()}</span>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  count,
  total,
  colorClass,
}: {
  readonly label: string;
  readonly count: number;
  readonly total: number;
  readonly colorClass: string;
}) {
  return (
    <div className={`rounded-lg p-3 ${colorClass.split(' ')[1]}`}>
      <p className={`text-2xl font-bold ${colorClass.split(' ')[0]}`}>{count}</p>
      <p className="text-xs text-text-tertiary">
        {label} ({total > 0 ? ((count / total) * 100).toFixed(0) : 0}%)
      </p>
    </div>
  );
}
