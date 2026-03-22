import { useAdminStatus, useAdminConfig, useRunMigrations } from '../hooks/use-admin';
import { DbHealthCard } from '../components/admin/DbHealthCard';
import { MigrationStatusCard } from '../components/admin/MigrationStatusCard';
import { TeamConnectionCard } from '../components/admin/TeamConnectionCard';

export function AdminPage() {
  const { data: statusData, isLoading: statusLoading } = useAdminStatus();
  const { data: configData, isLoading: configLoading } = useAdminConfig();
  const runMigrations = useRunMigrations();

  const status = statusData?.data ?? null;
  const config = configData?.data ?? null;
  const migrationResult = runMigrations.data?.data ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-text-tertiary">Database management and configuration</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DbHealthCard health={status?.database ?? null} isLoading={statusLoading} />

        <MigrationStatusCard
          migrations={status?.migrations ?? null}
          isLoading={statusLoading}
          onRunMigrations={() => runMigrations.mutate()}
          isMigrating={runMigrations.isPending}
          migrationResult={migrationResult}
        />

        <TeamConnectionCard
          config={config}
          ssl={status?.ssl ?? null}
          isLoading={statusLoading || configLoading}
        />
      </div>
    </div>
  );
}
