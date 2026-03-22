import { useQueryClient } from '@tanstack/react-query';
import type { DbProvider } from '@context-sync/shared';
import type { WizardStep } from '../../hooks/use-migration-wizard';
import { useSaveDbConfig } from '../../hooks/use-db-config';
import { Modal } from '../ui/Modal';
import { StepWizard } from '../ui/StepWizard';
import { DbSetupStep } from './steps/DbSetupStep';
import { MigrationPreviewStep } from './steps/MigrationPreviewStep';
import { MigrationExecuteStep } from './steps/MigrationExecuteStep';
import { CompletionStep } from './steps/CompletionStep';

const STEPS = [
  { id: 'setup', label: 'DB Setup' },
  { id: 'preview', label: 'Preview' },
  { id: 'execute', label: 'Migrate' },
  { id: 'complete', label: 'Done' },
] as const;

interface MigrationWizardModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly projectId: string;
  readonly step: WizardStep;
  readonly connectionUrl: string;
  readonly provider: DbProvider;
  readonly sslEnabled: boolean;
  readonly onStepChange: (step: WizardStep) => void;
  readonly onConnectionInfoChange: (info: {
    connectionUrl: string;
    provider: DbProvider;
    sslEnabled: boolean;
  }) => void;
}

export function MigrationWizardModal({
  isOpen,
  onClose,
  projectId,
  step,
  connectionUrl,
  provider,
  sslEnabled,
  onStepChange,
  onConnectionInfoChange,
}: MigrationWizardModalProps) {
  const saveConfigMutation = useSaveDbConfig(projectId);
  const queryClient = useQueryClient();

  const handleSetupNext = () => {
    // Save config and proceed to preview (manual flow)
    saveConfigMutation.mutate(
      { connectionUrl, provider, sslEnabled },
      {
        onSuccess: () => onStepChange('preview'),
      },
    );
  };

  const handleAutoSetupComplete = () => {
    // Auto setup already saved config via the backend endpoint
    queryClient.invalidateQueries({ queryKey: ['db-config', projectId] });
    onStepChange('preview');
  };

  const handleComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['db-config', projectId] });
    onStepChange('complete');
  };

  const handleClose = () => {
    queryClient.invalidateQueries({ queryKey: ['db-config', projectId] });
    onClose();
  };

  // Prevent closing during migration
  const canClose = step !== 'execute';

  return (
    <Modal
      isOpen={isOpen}
      onClose={canClose ? handleClose : () => {}}
      title="Connect Remote Database"
      size="lg"
    >
      <div className="mb-6">
        <StepWizard steps={STEPS} currentStepId={step} />
      </div>

      {step === 'setup' && (
        <DbSetupStep
          projectId={projectId}
          connectionUrl={connectionUrl}
          provider={provider}
          sslEnabled={sslEnabled}
          onConnectionInfoChange={onConnectionInfoChange}
          onNext={handleSetupNext}
          onAutoSetupComplete={handleAutoSetupComplete}
        />
      )}

      {step === 'preview' && (
        <MigrationPreviewStep
          projectId={projectId}
          onNext={() => onStepChange('execute')}
          onBack={() => onStepChange('setup')}
        />
      )}

      {step === 'execute' && (
        <MigrationExecuteStep projectId={projectId} onComplete={handleComplete} />
      )}

      {step === 'complete' && <CompletionStep onClose={handleClose} />}

      {saveConfigMutation.isError && step === 'setup' && (
        <p className="mt-2 text-sm text-red-400">
          {saveConfigMutation.error instanceof Error
            ? saveConfigMutation.error.message
            : 'Failed to save configuration'}
        </p>
      )}
    </Modal>
  );
}
