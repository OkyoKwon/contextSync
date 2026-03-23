import { useAuthStore } from '../../stores/auth.store';
import { useAdminStatus, useRunMigrations } from '../../hooks/use-admin';
import { DbHealthCard } from '../admin/DbHealthCard';
import { MigrationStatusCard } from '../admin/MigrationStatusCard';

export function DatabaseAdminSection() {
  const role = useAuthStore((s) => s.user?.role);
  const isOwner = role === 'owner';

  const { data: statusData, isLoading } = useAdminStatus(isOwner);
  const runMigrations = useRunMigrations();

  if (!isOwner) return null;

  const status = statusData?.data ?? null;
  const migrationResult = runMigrations.data?.data ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold text-text-primary">Database Administration</h3>
        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
          Owner
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DbHealthCard health={status?.database ?? null} isLoading={isLoading} />
        <MigrationStatusCard
          migrations={status?.migrations ?? null}
          isLoading={isLoading}
          onRunMigrations={() => runMigrations.mutate()}
          isMigrating={runMigrations.isPending}
          migrationResult={migrationResult}
        />
      </div>
    </div>
  );
}
