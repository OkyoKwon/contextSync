import { useState, useCallback, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../../stores/auth.store';
import { projectsApi } from '../../api/projects.api';
import { prdAnalysisApi } from '../../api/prd-analysis.api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DirectoryPicker } from './DirectoryPicker';
import { PrdDropZone } from '../prd-analysis/PrdDropZone';

type Step = 1 | 2 | 3;

interface CreateProjectModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

function StepIndicator({ current, total }: { readonly current: Step; readonly total: number }) {
  return (
    <div className="mb-4 flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isCompleted = stepNum < current;
        return (
          <div key={stepNum} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`h-px w-6 ${isCompleted ? 'bg-blue-500' : 'bg-border-default'}`} />
            )}
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-500 text-white'
                  : isCompleted
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-surface-overlay text-text-tertiary'
              }`}
            >
              {isCompleted ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                stepNum
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const navigate = useNavigate();
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [localDirectory, setLocalDirectory] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [prdStatus, setPrdStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('idle');

  const resetState = useCallback(() => {
    setStep(1);
    setName('');
    setRepoUrl('');
    setLocalDirectory(null);
    setCreatedProjectId(null);
    setPrdStatus('idle');
  }, []);

  const createMutation = useMutation({
    mutationFn: () =>
      projectsApi.create({
        name,
        repoUrl: repoUrl || undefined,
        localDirectory: localDirectory ?? undefined,
      }),
    onSuccess: (result) => {
      if (result.data) {
        const projectId = result.data.id;
        setCreatedProjectId(projectId);
        setCurrentProject(projectId);
        queryClient.invalidateQueries({ queryKey: ['projects'] });

        if (localDirectory) {
          setStep(3);
        } else {
          resetState();
          onClose();
          navigate('/dashboard');
        }
      }
    },
  });

  const handleClose = useCallback(() => {
    if (createMutation.isPending || prdStatus === 'uploading' || prdStatus === 'analyzing') {
      return;
    }
    resetState();
    onClose();
  }, [createMutation.isPending, prdStatus, resetState, onClose]);

  const handleSkipPrd = useCallback(() => {
    resetState();
    onClose();
    navigate('/dashboard');
  }, [resetState, onClose, navigate]);

  const handlePrdFileDrop = useCallback(
    async (file: File) => {
      if (!createdProjectId) return;

      try {
        setPrdStatus('uploading');
        const uploadResult = await prdAnalysisApi.uploadDocument(createdProjectId, file);

        if (!uploadResult.data) {
          toast.error('Failed to upload PRD document');
          setPrdStatus('idle');
          return;
        }

        setPrdStatus('analyzing');
        const analysisResult = await prdAnalysisApi.startAnalysis(
          createdProjectId,
          uploadResult.data.id,
        );

        if (analysisResult.data) {
          queryClient.invalidateQueries({ queryKey: ['prd-documents', createdProjectId] });
          queryClient.invalidateQueries({ queryKey: ['prd-analysis-latest', createdProjectId] });
          queryClient.invalidateQueries({ queryKey: ['prd-analysis-history', createdProjectId] });
          toast.success('PRD analysis complete');
          setPrdStatus('done');
          resetState();
          onClose();
          navigate('/prd');
        } else {
          toast.error('PRD analysis failed');
          setPrdStatus('idle');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to process PRD document');
        setPrdStatus('idle');
      }
    },
    [createdProjectId, queryClient, resetState, onClose, navigate],
  );

  const stepTitle =
    step === 1 ? 'Create Project' : step === 2 ? 'Link Working Directory' : 'Upload PRD';

  const isBusy = createMutation.isPending || prdStatus === 'uploading' || prdStatus === 'analyzing';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={stepTitle}>
      <StepIndicator current={step} total={3} />

      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) setStep(2);
          }}
          className="space-y-3"
        >
          <Input
            label="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Project"
          />
          <Input
            label="Repository URL (optional)"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/org/repo"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Next
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div
          className="space-y-3"
          onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter' && name.trim() && !createMutation.isPending) {
              createMutation.mutate();
            }
          }}
        >
          <DirectoryPicker value={localDirectory} onChange={setLocalDirectory} defaultToActive />
          {createMutation.isError && (
            <p className="text-sm text-red-400">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : 'Failed to create project'}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setStep(1)}
              disabled={createMutation.isPending}
            >
              Back
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Optionally upload a PRD document to start tracking implementation progress.
          </p>
          {prdStatus === 'uploading' && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-text-secondary">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Uploading document...
            </div>
          )}
          {prdStatus === 'analyzing' && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-text-secondary">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Analyzing PRD...
            </div>
          )}
          {prdStatus === 'idle' && (
            <PrdDropZone onFileDrop={handlePrdFileDrop} isUploading={false} compact />
          )}
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={handleSkipPrd} disabled={isBusy}>
              Skip
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
