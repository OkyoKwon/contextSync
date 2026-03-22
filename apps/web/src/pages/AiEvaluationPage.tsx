import { useState } from 'react';
import { showToast } from '../lib/toast';
import {
  useTeamEvaluationSummary,
  useStartEvaluation,
  useLatestEvaluation,
  useEvaluationDetail,
  useEvaluationHistory,
} from '../hooks/use-ai-evaluation';
import { useRequireProject } from '../hooks/use-require-project';
import { useAuthStore } from '../stores/auth.store';
import { useApiKeyGuard } from '../hooks/use-api-key-guard';
import { TeamEvaluationSummary } from '../components/ai-evaluation/TeamEvaluationSummary';
import { EvaluationDashboard } from '../components/ai-evaluation/EvaluationDashboard';
import { EvaluationHistory } from '../components/ai-evaluation/EvaluationHistory';
import { TriggerEvaluationDialog } from '../components/ai-evaluation/TriggerEvaluationDialog';
import { ApiKeyMissingBanner } from '../components/shared/ApiKeyMissingBanner';
import { NoProjectState } from '../components/shared/NoProjectState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

export function AiEvaluationPage() {
  const { isProjectSelected, isLoading: isProjectLoading } = useRequireProject();
  const hasKey = useAuthStore((s) => s.user?.hasAnthropicApiKey ?? false);
  const openApiKeyGuard = useApiKeyGuard((s) => s.openApiKeyGuard);
  const { data: summaryData, isLoading: isSummaryLoading } = useTeamEvaluationSummary();
  const startEvaluation = useStartEvaluation();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [showTriggerDialog, setShowTriggerDialog] = useState(false);

  const { data: latestData } = useLatestEvaluation(selectedUserId);
  const { data: detailData } = useEvaluationDetail(selectedEvaluationId);
  const { data: historyData } = useEvaluationHistory(selectedUserId);

  const members = summaryData?.data ?? [];
  const displayEvaluation = selectedEvaluationId
    ? (detailData?.data ?? null)
    : (latestData?.data ?? null);
  const historyEntries = historyData?.data ?? [];

  const selectedUserName = members.find((m) => m.userId === selectedUserId)?.userName;

  const handleTrigger = (targetUserId: string, dateRangeStart?: string, dateRangeEnd?: string) => {
    startEvaluation.mutate(
      {
        targetUserId,
        dateRangeStart: dateRangeStart ? new Date(dateRangeStart).toISOString() : undefined,
        dateRangeEnd: dateRangeEnd ? new Date(dateRangeEnd).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          showToast.success('Evaluation completed');
          setShowTriggerDialog(false);
          setSelectedUserId(targetUserId);
          setSelectedEvaluationId(null);
        },
        onError: (err) => showToast.error(err.message),
      },
    );
  };

  if (isProjectLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isProjectSelected) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Evaluation</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Evaluate team members' AI utilization skills
          </p>
        </div>
        <NoProjectState pageName="AI Evaluation" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Evaluation</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Evaluate team members' AI utilization skills
          </p>
        </div>
        <Button
          onClick={() => {
            if (hasKey) {
              setShowTriggerDialog(true);
            } else {
              openApiKeyGuard(() => setShowTriggerDialog(true));
            }
          }}
        >
          Run Evaluation
        </Button>
      </div>

      <ApiKeyMissingBanner />

      {/* Team Summary */}
      {isSummaryLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <TeamEvaluationSummary members={members} onSelectUser={handleSelectUser} />
      )}

      {/* Selected User Detail */}
      {selectedUserId && (
        <>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedUserId(null);
                setSelectedEvaluationId(null);
              }}
              className="text-sm text-text-tertiary hover:text-text-primary"
            >
              &larr; Back to team
            </button>
            <span className="text-sm text-text-tertiary">/</span>
            <span className="text-sm font-medium text-text-primary">
              {selectedUserName ?? 'User'}
            </span>
          </div>

          {displayEvaluation ? (
            <EvaluationDashboard evaluation={displayEvaluation} />
          ) : (
            <Card padding="lg" className="text-center text-sm text-text-tertiary">
              No evaluations found for this user. Run an evaluation to get started.
            </Card>
          )}

          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
              Evaluation History
            </h2>
            <EvaluationHistory
              entries={historyEntries}
              onSelectEvaluation={setSelectedEvaluationId}
            />
          </Card>
        </>
      )}

      <TriggerEvaluationDialog
        isOpen={showTriggerDialog}
        onClose={() => setShowTriggerDialog(false)}
        members={members}
        onTrigger={handleTrigger}
        isPending={startEvaluation.isPending}
      />
    </div>
  );

  function handleSelectUser(userId: string) {
    setSelectedUserId(userId);
    setSelectedEvaluationId(null);
  }
}
