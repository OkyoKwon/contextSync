import { useState } from 'react';
import type { MigrationInfo, MigrationRunResult } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface MigrationStatusCardProps {
  readonly migrations: readonly MigrationInfo[] | null;
  readonly isLoading: boolean;
  readonly onRunMigrations: () => void;
  readonly isMigrating: boolean;
  readonly migrationResult: MigrationRunResult | null;
}

export function MigrationStatusCard({
  migrations,
  isLoading,
  onRunMigrations,
  isMigrating,
  migrationResult,
}: MigrationStatusCardProps) {
  const [showAll, setShowAll] = useState(false);

  const pendingCount = migrations?.filter((m) => m.executedAt === null).length ?? 0;
  const appliedCount = migrations?.filter((m) => m.executedAt !== null).length ?? 0;
  const displayedMigrations = showAll ? migrations : migrations?.slice(-10);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MigrationIcon />
          <h2 className="text-lg font-semibold text-text-primary">Migrations</h2>
          {migrations && (
            <div className="flex gap-2">
              <Badge variant="success">{appliedCount} applied</Badge>
              {pendingCount > 0 && <Badge variant="warning">{pendingCount} pending</Badge>}
            </div>
          )}
        </div>
        <Button size="sm" onClick={onRunMigrations} disabled={isMigrating || pendingCount === 0}>
          {isMigrating ? 'Running...' : 'Run Migrations'}
        </Button>
      </div>

      {migrationResult && (
        <div
          className={`mb-4 rounded-lg p-3 text-sm ${
            migrationResult.errors.length > 0
              ? 'bg-red-500/10 text-red-400'
              : 'bg-green-500/10 text-green-400'
          }`}
        >
          {migrationResult.applied.length > 0 && (
            <p>Applied: {migrationResult.applied.join(', ')}</p>
          )}
          {migrationResult.errors.length > 0 && <p>Errors: {migrationResult.errors.join(', ')}</p>}
          {migrationResult.applied.length === 0 && migrationResult.errors.length === 0 && (
            <p>No pending migrations to apply.</p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-64 animate-pulse rounded bg-surface-hover" />
          ))}
        </div>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {displayedMigrations?.map((m) => (
            <div key={m.name} className="flex items-center justify-between py-1.5 text-sm">
              <span className="font-mono text-text-secondary truncate mr-3">{m.name}</span>
              {m.executedAt ? (
                <span className="text-xs text-text-tertiary whitespace-nowrap">
                  {new Date(m.executedAt).toLocaleDateString()}
                </span>
              ) : (
                <Badge variant="warning">Pending</Badge>
              )}
            </div>
          ))}
          {migrations && migrations.length > 10 && (
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              {showAll ? 'Show recent only' : `Show all ${migrations.length} migrations`}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

function MigrationIcon() {
  return (
    <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
