import { useState } from 'react';
import type { EvaluationPerspective } from '@context-sync/shared';
import { showToast } from '../lib/toast';
import {
  useTeamEvaluationSummary,
  useStartEvaluation,
  useLatestEvaluationGroup,
  useEvaluationGroupHistory,
  useEvaluationDetail,
} from '../hooks/use-ai-evaluation';
import { useRequireProject } from '../hooks/use-require-project';
import { useAuthStore } from '../stores/auth.store';
import { useApiKeyGuard } from '../hooks/use-api-key-guard';
import { TeamEvaluationSummary } from '../components/ai-evaluation/TeamEvaluationSummary';
import { EvaluationDashboard } from '../components/ai-evaluation/EvaluationDashboard';
import { EvaluationHistory } from '../components/ai-evaluation/EvaluationHistory';
import { TriggerEvaluationDialog } from '../components/ai-evaluation/TriggerEvaluationDialog';
import { PerspectiveScoreSummary } from '../components/ai-evaluation/PerspectiveScoreSummary';
import { PerspectiveTabs } from '../components/ai-evaluation/PerspectiveTabs';
import { ApiKeyMissingBanner } from '../components/shared/ApiKeyMissingBanner';
import { NoProjectState } from '../components/shared/NoProjectState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { PageLayout } from '../components/ui/PageLayout';
import { Badge } from '../components/ui/Badge';

export function AiEvaluationPage() {
  const { isProjectSelected, isLoading: isProjectLoading } = useRequireProject();
  const hasKey = useAuthStore((s) => s.user?.hasAnthropicApiKey ?? false);
  const openApiKeyGuard = useApiKeyGuard((s) => s.openApiKeyGuard);
  const { data: summaryData, isLoading: isSummaryLoading } = useTeamEvaluationSummary();
  const startEvaluation = useStartEvaluation();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showTriggerDialog, setShowTriggerDialog] = useState(false);
  const [activePerspective, setActivePerspective] = useState<EvaluationPerspective>('claude');

  // Group-based data
  const { data: groupData } = useLatestEvaluationGroup(selectedUserId);
  const { data: groupHistoryData } = useEvaluationGroupHistory(selectedUserId);

  // For viewing a specific evaluation from history
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const { data: detailData } = useEvaluationDetail(selectedEvaluationId);

  const members = summaryData?.data ?? [];
  const evaluationGroup = groupData?.data ?? null;
  const groupHistoryEntries = groupHistoryData?.data ?? [];
  const selectedUserName = members.find((m) => m.userId === selectedUserId)?.userName;

  // Current display evaluation (from group or specific selection)
  const activeEvaluation = selectedEvaluationId
    ? (detailData?.data ?? null)
    : evaluationGroup
      ? evaluationGroup[activePerspective]
      : null;

  const handleTrigger = (targetUserId: string, dateRangeStart?: string, dateRangeEnd?: string) => {
    startEvaluation.mutate(
      {
        targetUserId,
        dateRangeStart: dateRangeStart ? new Date(dateRangeStart).toISOString() : undefined,
        dateRangeEnd: dateRangeEnd ? new Date(dateRangeEnd).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          showToast.success('Evaluation started for 3 perspectives');
          setShowTriggerDialog(false);
          setSelectedUserId(targetUserId);
          setSelectedEvaluationId(null);
          setActivePerspective('claude');
        },
        onError: (err) => showToast.error(err.message),
      },
    );
  };

  const handleSelectGroup = (groupId: string) => {
    // When user clicks a group in history, find the evaluation for active perspective
    const group = groupHistoryEntries.find((g) => g.groupId === groupId);
    if (group) {
      const perspectiveEntry = group.perspectives.find((p) => p.perspective === activePerspective);
      if (perspectiveEntry) {
        setSelectedEvaluationId(perspectiveEntry.evaluationId);
      }
    }
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
      <PageLayout>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Evaluation</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Evaluate team members' AI utilization skills
          </p>
        </div>
        <NoProjectState pageName="AI Evaluation" />
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Evaluation</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Multi-perspective AI utilization evaluation
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

          {evaluationGroup ? (
            <>
              {/* 3-perspective Score Summary */}
              <PerspectiveScoreSummary
                group={evaluationGroup}
                activePerspective={activePerspective}
                onSelectPerspective={(p) => {
                  setActivePerspective(p);
                  setSelectedEvaluationId(null);
                }}
              />

              {/* Perspective Tabs */}
              <Card padding="none">
                <PerspectiveTabs
                  group={evaluationGroup}
                  activePerspective={activePerspective}
                  onSelectPerspective={(p) => {
                    setActivePerspective(p);
                    setSelectedEvaluationId(null);
                  }}
                />

                {/* Active perspective content */}
                <div className="p-4">
                  {activeEvaluation?.status === 'completed' ? (
                    <EvaluationDashboard
                      evaluation={activeEvaluation}
                      perspective={
                        selectedEvaluationId ? activeEvaluation.perspective : activePerspective
                      }
                    />
                  ) : activeEvaluation?.status === 'analyzing' ||
                    activeEvaluation?.status === 'pending' ? (
                    <div className="flex flex-col items-center gap-3 py-12">
                      <Spinner />
                      <p className="text-sm text-text-tertiary">
                        Analyzing from {activePerspective} perspective...
                      </p>
                    </div>
                  ) : activeEvaluation?.status === 'failed' ? (
                    <div className="py-8 text-center">
                      <Badge variant="critical">Evaluation Failed</Badge>
                      <p className="mt-2 text-sm text-text-tertiary">
                        {activeEvaluation.errorMessage ?? 'An error occurred during analysis.'}
                      </p>
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-text-tertiary">
                      No evaluation data available for this perspective.
                    </p>
                  )}
                </div>
              </Card>
            </>
          ) : (
            <Card padding="lg" className="text-center text-sm text-text-tertiary">
              No evaluations found for this user. Run an evaluation to get started.
            </Card>
          )}

          {/* Group History */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
              Evaluation History
            </h2>
            <EvaluationHistory entries={groupHistoryEntries} onSelectGroup={handleSelectGroup} />
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
    </PageLayout>
  );

  function handleSelectUser(userId: string) {
    setSelectedUserId(userId);
    setSelectedEvaluationId(null);
    setActivePerspective('claude');
  }
}
