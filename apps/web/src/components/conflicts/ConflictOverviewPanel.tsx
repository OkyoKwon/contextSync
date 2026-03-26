import type { Conflict, ConflictOverviewAnalysis } from '@context-sync/shared';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useConflictOverview } from '../../hooks/use-conflicts';
import { showToast } from '../../lib/toast';

interface ConflictOverviewPanelProps {
  conflicts: readonly Conflict[];
}

const riskConfig: Record<
  ConflictOverviewAnalysis['riskLevel'],
  { label: string; variant: 'critical' | 'warning' | 'info' | 'success' }
> = {
  critical: { label: 'Critical', variant: 'critical' },
  high: { label: 'High', variant: 'warning' },
  moderate: { label: 'Moderate', variant: 'info' },
  low: { label: 'Low', variant: 'success' },
};

function computeBasicStats(conflicts: readonly Conflict[]) {
  let info = 0;
  let warning = 0;
  let critical = 0;
  let active = 0;
  let resolved = 0;

  for (const c of conflicts) {
    if (c.severity === 'info') info++;
    else if (c.severity === 'warning') warning++;
    else if (c.severity === 'critical') critical++;

    if (c.status === 'detected' || c.status === 'reviewing') active++;
    else resolved++;
  }

  return { info, warning, critical, active, resolved, total: conflicts.length };
}

export function ConflictOverviewPanel({ conflicts }: ConflictOverviewPanelProps) {
  const overviewMutation = useConflictOverview();
  const result = overviewMutation.data?.data ?? null;

  const handleAnalyze = () => {
    overviewMutation.mutate(undefined, {
      onError: (err) => showToast.error(err.message),
    });
  };

  const stats = computeBasicStats(conflicts);

  if (!result) {
    return (
      <div className="mb-4 rounded-xl border border-border-default bg-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-primary">Project Conflict Overview</h3>
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={overviewMutation.isPending}
            isLoading={overviewMutation.isPending}
          >
            {overviewMutation.isPending ? 'Analyzing...' : 'Analyze Overview'}
          </Button>
        </div>

        {overviewMutation.isPending ? (
          <p className="mt-2 text-xs text-text-muted">프로젝트 전체 충돌 상황을 분석 중입니다...</p>
        ) : (
          <div className="mt-3 flex items-center gap-4">
            <StatPill label="Total" value={stats.total} />
            <StatPill label="Active" value={stats.active} color="text-yellow-400" />
            <StatPill label="Resolved" value={stats.resolved} color="text-green-400" />
            <div className="mx-1 h-4 w-px bg-border-default" />
            {stats.critical > 0 && (
              <StatPill label="Critical" value={stats.critical} color="text-red-400" />
            )}
            {stats.warning > 0 && (
              <StatPill label="Warning" value={stats.warning} color="text-yellow-400" />
            )}
            <StatPill label="Info" value={stats.info} color="text-blue-400" />
          </div>
        )}
      </div>
    );
  }

  const risk = riskConfig[result.riskLevel];
  const dist = result.verdictDistribution;
  const total = result.totalCount || 1;

  return (
    <div className="mb-4 rounded-xl border border-border-default bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-text-primary">Project Conflict Overview</h3>
          <Badge variant={risk.variant}>Risk: {risk.label}</Badge>
          <span className="text-xs text-text-muted">
            {result.analyzedCount}/{result.totalCount} analyzed
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleAnalyze}
          disabled={overviewMutation.isPending}
          isLoading={overviewMutation.isPending}
        >
          Re-analyze
        </Button>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-text-secondary">{result.summary}</p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <h4 className="text-xs font-medium text-text-muted">Verdict Distribution</h4>
          <div className="mt-2 space-y-1.5">
            <DistributionBar
              label="Real Conflict"
              count={dist.realConflict}
              total={total}
              color="bg-red-500"
            />
            <DistributionBar
              label="Likely Conflict"
              count={dist.likelyConflict}
              total={total}
              color="bg-orange-500"
            />
            <DistributionBar
              label="Low Risk"
              count={dist.lowRisk}
              total={total}
              color="bg-blue-500"
            />
            <DistributionBar
              label="False Positive"
              count={dist.falsePositive}
              total={total}
              color="bg-green-500"
            />
            {dist.notAnalyzed > 0 && (
              <DistributionBar
                label="Not Analyzed"
                count={dist.notAnalyzed}
                total={total}
                color="bg-zinc-500"
              />
            )}
          </div>
        </div>

        {result.hotspotFiles.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-text-muted">Hotspot Files</h4>
            <div className="mt-2 space-y-1">
              {result.hotspotFiles.map((file) => (
                <div
                  key={file}
                  className="rounded bg-red-500/10 px-2 py-1 text-xs font-mono text-red-400"
                >
                  {file}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {result.memberPairs.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-text-muted">Team Coordination</h4>
          <div className="mt-2 space-y-2">
            {result.memberPairs.map((pair, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-border-default p-3"
              >
                <span className="shrink-0 text-sm font-medium text-text-primary">
                  {pair.userA} ↔ {pair.userB}
                </span>
                <span className="text-xs text-text-muted">({pair.conflictCount} conflicts)</span>
                <span className="ml-auto text-xs text-text-secondary">{pair.recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.teamRecommendations.length > 0 && (
        <div className="mt-4 rounded-lg bg-blue-500/5 p-3">
          <h4 className="text-xs font-medium text-blue-400">Recommendations</h4>
          <ul className="mt-1.5 space-y-1">
            {result.teamRecommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-text-secondary">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-text-muted">{label}</span>
      <span className={`text-sm font-semibold ${color ?? 'text-text-primary'}`}>{value}</span>
    </div>
  );
}

function DistributionBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  if (count === 0) return null;
  const pct = Math.round((count / total) * 100);

  return (
    <div className="flex items-center gap-2">
      <span className="w-28 text-xs text-text-secondary">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-surface-hover">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-xs text-text-muted">
        {count} ({pct}%)
      </span>
    </div>
  );
}
