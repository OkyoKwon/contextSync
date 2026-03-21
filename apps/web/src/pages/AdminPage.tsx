import { useAdminStatus, useAdminConfig, useRunMigrations } from '../hooks/use-admin';
import { DbHealthCard } from '../components/admin/DbHealthCard';
import { MigrationStatusCard } from '../components/admin/MigrationStatusCard';
import { TeamConnectionCard } from '../components/admin/TeamConnectionCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

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
        <p className="mt-1 text-sm text-text-tertiary">
          Database management and team deployment configuration
        </p>
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

        <ProviderInfoCard config={config} isLoading={configLoading} />
      </div>
    </div>
  );
}

function ProviderInfoCard({
  config,
  isLoading,
}: {
  readonly config: import('@context-sync/shared').AdminConfig | null;
  readonly isLoading: boolean;
}) {
  const isSupabase = config?.databaseProvider === 'supabase';

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <ProviderIcon />
        <h2 className="text-lg font-semibold text-text-primary">Provider Info</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-40 animate-pulse rounded bg-surface-hover" />
          ))}
        </div>
      ) : config ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-tertiary">Deployment Mode</span>
            <Badge variant="info">{config.deploymentMode}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-tertiary">Provider</span>
            <Badge variant={isSupabase ? 'success' : 'default'}>{config.databaseProvider}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-tertiary">SSL</span>
            <Badge variant={config.sslEnabled ? 'success' : 'warning'}>
              {config.sslEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          {isSupabase && config.supabaseDashboardUrl && (
            <a
              href={config.supabaseDashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2.5 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/20"
            >
              <span>Open Supabase Dashboard</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>
      ) : (
        <p className="text-sm text-text-tertiary">Unable to load provider info</p>
      )}
    </Card>
  );
}

function ProviderIcon() {
  return (
    <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
      />
    </svg>
  );
}
