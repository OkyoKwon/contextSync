import { useEffect, useRef } from 'react';
import { Spinner } from '../ui/Spinner';
import { showToast } from '../../lib/toast';

interface SyncResult {
  readonly success: boolean;
  readonly detectedConflicts?: number;
}

interface SyncData {
  readonly syncedCount: number;
  readonly results: readonly SyncResult[];
}

interface SyncMutationLike {
  readonly isPending: boolean;
  readonly isSuccess: boolean;
  readonly isError: boolean;
  readonly data?: { readonly data?: SyncData | null } | null;
  readonly error: unknown;
}

interface SyncStatusIndicatorProps {
  readonly syncMutation: SyncMutationLike;
}

export function SyncStatusIndicator({ syncMutation }: SyncStatusIndicatorProps) {
  const prevStatus = useRef<'idle' | 'pending' | 'success' | 'error'>('idle');

  useEffect(() => {
    const currentStatus = syncMutation.isPending
      ? 'pending'
      : syncMutation.isSuccess
        ? 'success'
        : syncMutation.isError
          ? 'error'
          : 'idle';

    if (currentStatus === prevStatus.current) return;

    if (currentStatus === 'success' && prevStatus.current === 'pending') {
      const data = syncMutation.data?.data;
      if (data) {
        const hasConflicts = data.results.some((r) => (r.detectedConflicts ?? 0) > 0);
        const failedCount = data.results.filter((r) => !r.success).length;

        if (failedCount > 0) {
          showToast.error(`${failedCount} session(s) failed to sync`);
        } else if (hasConflicts) {
          showToast.info(
            `Synced ${data.syncedCount} session(s). Conflicts detected — check the Conflicts page.`,
          );
        } else {
          showToast.success(`Synced ${data.syncedCount} session(s)`);
        }
      }
    }

    if (currentStatus === 'error' && prevStatus.current === 'pending') {
      const message =
        syncMutation.error instanceof Error ? syncMutation.error.message : 'Sync failed';
      showToast.error(message);
    }

    prevStatus.current = currentStatus;
  }, [
    syncMutation.isPending,
    syncMutation.isSuccess,
    syncMutation.isError,
    syncMutation.data,
    syncMutation.error,
  ]);

  if (syncMutation.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-tertiary">
        <Spinner size="sm" />
        <span>Syncing sessions...</span>
      </div>
    );
  }

  return null;
}
