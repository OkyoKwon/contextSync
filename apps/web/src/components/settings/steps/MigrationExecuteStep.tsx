import { useEffect } from 'react';
import { useStartMigration, useMigrationProgress } from '../../../hooks/use-db-config';
import { ProgressBar } from '../../ui/ProgressBar';
import { Spinner } from '../../ui/Spinner';
import { Button } from '../../ui/Button';

interface MigrationExecuteStepProps {
  readonly projectId: string;
  readonly onComplete: () => void;
}

export function MigrationExecuteStep({ projectId, onComplete }: MigrationExecuteStepProps) {
  const startMutation = useStartMigration(projectId);
  const { data: progressData } = useMigrationProgress(projectId, true);
  const progress = progressData?.data ?? null;

  useEffect(() => {
    if (!startMutation.isSuccess && !startMutation.isPending && !startMutation.isError) {
      startMutation.mutate();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (progress?.status === 'completed') {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [progress?.status, onComplete]);

  const isRunning = progress?.status === 'running' || startMutation.isPending;
  const isFailed = progress?.status === 'failed' || startMutation.isError;

  const totalRows = (progress?.totalSessions ?? 0) + (progress?.totalMessages ?? 0);
  const migratedRows = (progress?.migratedSessions ?? 0) + (progress?.migratedMessages ?? 0);

  return (
    <div className="space-y-4">
      {isRunning && (
        <>
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
            <p className="text-sm text-yellow-400">
              Migration is in progress. Please do not close your browser until it completes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Spinner />
            <p className="text-sm text-text-secondary">Migrating data to remote database...</p>
          </div>

          <ProgressBar value={migratedRows} max={totalRows} label="Overall Progress" />

          <div className="space-y-2 rounded-lg bg-bg-secondary p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-tertiary">Sessions</span>
              <span className="text-text-primary">
                {progress?.migratedSessions ?? 0} / {progress?.totalSessions ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Messages</span>
              <span className="text-text-primary">
                {progress?.migratedMessages ?? 0} / {progress?.totalMessages ?? 0}
              </span>
            </div>
          </div>
        </>
      )}

      {progress?.status === 'completed' && (
        <div className="rounded-lg bg-green-500/10 p-4 text-center">
          <p className="font-medium text-green-400">Migration completed successfully!</p>
        </div>
      )}

      {isFailed && (
        <div className="space-y-3">
          <div className="rounded-lg bg-red-500/10 p-4">
            <p className="font-medium text-red-400">Migration failed</p>
            <p className="mt-1 text-sm text-red-400/80">
              {progress?.errorMessage ?? startMutation.error?.message ?? 'Unknown error'}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
          >
            Retry Migration
          </Button>
        </div>
      )}
    </div>
  );
}
