import type { DbConfigStatus } from '@context-sync/shared';
import { Badge } from '../ui/Badge';

const STATUS_MAP: Record<
  DbConfigStatus,
  { label: string; variant: 'success' | 'warning' | 'critical' | 'info' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  migrating: { label: 'Migrating', variant: 'info' },
  active: { label: 'Connected', variant: 'success' },
  failed: { label: 'Failed', variant: 'critical' },
};

interface DbStatusBadgeProps {
  readonly status: DbConfigStatus;
}

export function DbStatusBadge({ status }: DbStatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, variant: 'info' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
