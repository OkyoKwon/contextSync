import type { DbConfigStatus } from '@context-sync/shared';
import { useDbConfig, useDeleteDbConfig } from '../../hooks/use-db-config';
import { usePermissions } from '../../hooks/use-permissions';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { DbStatusBadge } from './DbStatusBadge';

interface RemoteDbSectionProps {
  readonly projectId: string;
  readonly onConnectClick: () => void;
}

export function RemoteDbSection({ projectId, onConnectClick }: RemoteDbSectionProps) {
  const { data, isLoading } = useDbConfig(projectId);
  const deleteMutation = useDeleteDbConfig(projectId);
  const { isOwner } = usePermissions();

  const config = data?.data ?? null;

  if (isLoading) return <Spinner />;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Remote Database</h3>
          <p className="mt-1 text-sm text-text-tertiary">
            Connect a remote database to enable team collaboration.
          </p>
        </div>
        {config && <DbStatusBadge status={config.status as DbConfigStatus} />}
      </div>

      {config ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-bg-secondary p-3">
            <div className="space-y-2">
              <InfoRow label="Provider" value={config.provider} />
              <InfoRow label="Connection" value={config.maskedUrl} />
              <InfoRow label="Schema Version" value={`v${config.schemaVersion}`} />
              {config.migratedAt && (
                <InfoRow label="Migrated At" value={new Date(config.migratedAt).toLocaleString()} />
              )}
            </div>
          </div>

          {isOwner && config.status !== 'migrating' && (
            <div className="flex gap-2">
              {config.status === 'failed' && (
                <Button size="sm" onClick={onConnectClick}>
                  Retry Connection
                </Button>
              )}
              <Button
                size="sm"
                variant="danger"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Disconnecting...' : 'Disconnect Remote DB'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4">
          {isOwner ? (
            <Button onClick={onConnectClick}>Connect Remote Database</Button>
          ) : (
            <p className="text-sm text-text-tertiary">
              Only the project owner can configure the remote database.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function InfoRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-text-tertiary">{label}</span>
      <span className="text-text-primary font-mono text-xs">{value}</span>
    </div>
  );
}
