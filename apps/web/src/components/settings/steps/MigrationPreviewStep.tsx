import { useMigrationPreview } from '../../../hooks/use-db-config';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';

interface MigrationPreviewStepProps {
  readonly projectId: string;
  readonly onNext: () => void;
  readonly onBack: () => void;
}

export function MigrationPreviewStep({ projectId, onNext, onBack }: MigrationPreviewStepProps) {
  const { data, isLoading } = useMigrationPreview(projectId);
  const preview = data?.data ?? null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        The following data will be migrated to the remote database:
      </p>

      {preview && (
        <div className="space-y-2 rounded-lg bg-bg-secondary p-4">
          <DataRow label="Sessions" value={preview.sessions} />
          <DataRow label="Messages" value={preview.messages} />
          <DataRow label="Conflicts" value={preview.conflicts} />
          <div className="border-t border-border-default pt-2">
            <DataRow
              label="Estimated time"
              value={`~${formatDuration(preview.estimatedSeconds)}`}
              isText
            />
          </div>
        </div>
      )}

      <p className="text-xs text-text-tertiary">
        Data will be copied to the remote database. Your local data will remain intact.
      </p>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Start Migration</Button>
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  isText = false,
}: {
  readonly label: string;
  readonly value: number | string;
  readonly isText?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-text-tertiary">{label}</span>
      <span className="font-medium text-text-primary">
        {isText ? value : (value as number).toLocaleString()}
      </span>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}
