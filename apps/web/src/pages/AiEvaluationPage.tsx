import { useState } from 'react';
import type { EvaluationPerspective } from '@context-sync/shared';
import type { EvalContentLang } from '../components/ai-evaluation/EvalLanguageToggle';
import { EvalLanguageToggle } from '../components/ai-evaluation/EvalLanguageToggle';
import { showToast } from '../lib/toast';
import {
  useTeamEvaluationSummary,
  useStartEvaluation,
  useLatestEvaluationGroup,
  useEvaluationGroupHistory,
  useEvaluationDetail,
  useLearningGuide,
  useRegenerateLearningGuide,
  useDeleteEvaluationGroup,
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
import { LearningRoadmap } from '../components/ai-evaluation/LearningRoadmap';
import { EvaluationProgressBar } from '../components/ai-evaluation/EvaluationProgressBar';
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
  const deleteGroup = useDeleteEvaluationGroup();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showTriggerDialog, setShowTriggerDialog] = useState(false);
  const [activePerspective, setActivePerspective] = useState<EvaluationPerspective>('claude');
  const [activeSection, setActiveSection] = useState<'results' | '4d' | 'roadmap'>('results');

  // Group-based data
  const { data: groupData } = useLatestEvaluationGroup(selectedUserId);
  const { data: groupHistoryData } = useEvaluationGroupHistory(selectedUserId);

  // For viewing a specific evaluation from history
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [contentLang, setContentLang] = useState<EvalContentLang>('en');
  const { data: detailData } = useEvaluationDetail(selectedEvaluationId);

  const groupId = groupData?.data?.groupId ?? null;
  const { data: learningGuideData, isLoading: isGuideLoading } = useLearningGuide(groupId);
  const regenerateGuide = useRegenerateLearningGuide();

  const members = summaryData?.data ?? [];
  const evaluationGroup = groupData?.data ?? null;
  const groupHistoryEntries = groupHistoryData?.data ?? [];
  const learningGuide = learningGuideData?.data ?? null;
  const fourDEval = evaluationGroup?.fourDFramework ?? null;
  const selectedUserName = members.find((m) => m.userId === selectedUserId)?.userName;

  // Current display evaluation (from group or specific selection)
  const getGroupEval = (p: EvaluationPerspective) => {
    if (!evaluationGroup) return null;
    if (p === 'claude') return evaluationGroup.claude;
    if (p === 'chatgpt') return evaluationGroup.chatgpt;
    if (p === 'gemini') return evaluationGroup.gemini;
    if (p === '4d_framework') return evaluationGroup.fourDFramework;
    return null;
  };
  const activeEvaluation = selectedEvaluationId
    ? (detailData?.data ?? null)
    : getGroupEval(activePerspective);

  const handleTrigger = (targetUserId: string, dateRangeStart?: string, dateRangeEnd?: string) => {
    // Close modal immediately and switch to user view
    setShowTriggerDialog(false);
    setSelectedUserId(targetUserId);
    setSelectedEvaluationId(null);
    setActivePerspective('claude');

    startEvaluation.mutate(
      {
        targetUserId,
        dateRangeStart: dateRangeStart ? new Date(dateRangeStart).toISOString() : undefined,
        dateRangeEnd: dateRangeEnd ? new Date(dateRangeEnd).toISOString() : undefined,
      },
      {
        onSuccess: () => showToast.success('Evaluation started for 3 perspectives'),
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
        <div className="flex items-center gap-3">
          <EvalLanguageToggle value={contentLang} onChange={setContentLang} />
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
              {/* Evaluation Progress */}
              <EvaluationProgressBar group={evaluationGroup} />

              {/* 3-perspective Score Summary — only relevant for Evaluation Results */}
              {activeSection === 'results' && (
                <PerspectiveScoreSummary
                  group={evaluationGroup}
                  activePerspective={activePerspective}
                  onSelectPerspective={(p) => {
                    setActivePerspective(p);
                    setSelectedEvaluationId(null);
                  }}
                />
              )}

              {/* Section Tabs */}
              {/* Section Tabs */}
              <div className="inline-flex rounded-lg border border-border-default bg-surface-secondary p-0.5">
                {(
                  [
                    { key: 'results' as const, label: 'Evaluation Results' },
                    { key: '4d' as const, label: '4D Framework' },
                    { key: 'roadmap' as const, label: 'Learning Roadmap' },
                  ] as const
                ).map(({ key, label }) => {
                  const isActive = activeSection === key;
                  const isLoading4D =
                    key === '4d' &&
                    fourDEval &&
                    (fourDEval.status === 'pending' || fourDEval.status === 'analyzing');
                  const isLoadingRoadmap =
                    key === 'roadmap' && (isGuideLoading || learningGuide?.status === 'generating');
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveSection(key)}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-surface-primary text-text-primary shadow-sm'
                          : 'text-text-tertiary hover:text-text-secondary'
                      }`}
                    >
                      {label}
                      {(isLoading4D || isLoadingRoadmap) && (
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Section Content */}
              {activeSection === 'results' ? (
                <>
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
                          contentLang={contentLang}
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

                  {/* Group History */}
                  <Card>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
                      Evaluation History
                    </h2>
                    <EvaluationHistory
                      entries={groupHistoryEntries}
                      onSelectGroup={handleSelectGroup}
                      onDeleteGroup={(gId) => deleteGroup.mutate(gId)}
                      isDeletingGroupId={
                        deleteGroup.isPending ? (deleteGroup.variables ?? null) : null
                      }
                    />
                  </Card>
                </>
              ) : activeSection === '4d' ? (
                fourDEval?.status === 'completed' ? (
                  <EvaluationDashboard
                    evaluation={fourDEval}
                    perspective={'4d_framework'}
                    contentLang={contentLang}
                  />
                ) : fourDEval?.status === 'analyzing' || fourDEval?.status === 'pending' ? (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <Spinner />
                    <p className="text-sm text-text-tertiary">Analyzing with 4D Framework...</p>
                  </div>
                ) : fourDEval?.status === 'failed' ? (
                  <div className="py-8 text-center">
                    <Badge variant="critical">4D Evaluation Failed</Badge>
                    <p className="mt-2 text-sm text-text-tertiary">
                      {fourDEval.errorMessage ?? 'An error occurred during 4D Framework analysis.'}
                    </p>
                  </div>
                ) : (
                  <Card padding="lg" className="text-center text-sm text-text-tertiary">
                    No 4D Framework evaluation data available. Run an evaluation to get started.
                  </Card>
                )
              ) : (
                <LearningRoadmap
                  guide={learningGuide}
                  isLoading={isGuideLoading}
                  contentLang={contentLang}
                  onRegenerate={groupId ? () => regenerateGuide.mutate(groupId) : undefined}
                  isRegenerating={regenerateGuide.isPending}
                />
              )}
            </>
          ) : startEvaluation.isPending ? (
            <Card>
              <div className="flex flex-col items-center gap-3 py-12">
                <Spinner />
                <p className="text-sm text-text-tertiary">Starting evaluation...</p>
              </div>
            </Card>
          ) : (
            <Card padding="lg" className="text-center text-sm text-text-tertiary">
              No evaluations found for this user. Run an evaluation to get started.
            </Card>
          )}
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
