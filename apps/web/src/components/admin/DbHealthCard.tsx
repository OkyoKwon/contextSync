import type { DatabaseHealth } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface DbHealthCardProps {
  readonly health: DatabaseHealth | null;
  readonly isLoading: boolean;
}

export function DbHealthCard({ health, isLoading }: DbHealthCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <DatabaseIcon />
        <h2 className="text-lg font-semibold text-text-primary">Database Health</h2>
        {health && (
          <Badge variant={health.connected ? 'success' : 'critical'}>
            {health.connected ? 'Connected' : 'Disconnected'}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-48 animate-pulse rounded bg-surface-hover" />
          ))}
        </div>
      ) : health ? (
        <div className="space-y-3">
          <StatRow label="Latency" value={`${health.latencyMs}ms`} />
          <StatRow label="Version" value={health.version} />
          <div className="pt-2 border-t border-border-default">
            <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-2">
              Connection Pool
            </p>
            <div className="grid grid-cols-3 gap-3">
              <PoolStat label="Active" value={health.pool.active} color="text-blue-400" />
              <PoolStat label="Idle" value={health.pool.idle} color="text-green-400" />
              <PoolStat label="Max" value={health.pool.max} color="text-text-tertiary" />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-tertiary">Unable to fetch database status</p>
      )}
    </Card>
  );
}

function StatRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-tertiary">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}

function PoolStat({
  label,
  value,
  color,
}: {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}) {
  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-text-tertiary">{label}</p>
    </div>
  );
}

function DatabaseIcon() {
  return (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
      />
    </svg>
  );
}
