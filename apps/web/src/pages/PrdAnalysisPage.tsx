import { useState } from 'react';
import { showToast } from '../lib/toast';
import {
  useStartAnalysis,
  useLatestPrdAnalysis,
  usePrdAnalysisDetail,
  usePrdDocuments,
  usePrdAnalysisHistory,
} from '../hooks/use-prd-analysis';
import { useRequireProject } from '../hooks/use-require-project';
import { useAuthStore } from '../stores/auth.store';
import { useApiKeyGuard } from '../hooks/use-api-key-guard';
import { PrdDocumentSection } from '../components/prd-analysis/PrdDocumentSection';
import { PrdStickyDocumentBar } from '../components/prd-analysis/PrdStickyDocumentBar';
import { PrdDashboard } from '../components/prd-analysis/PrdDashboard';
import { PrdRequirementList } from '../components/prd-analysis/PrdRequirementList';
import { PrdAnalysisHistory } from '../components/prd-analysis/PrdAnalysisHistory';
import { AnalyzingOverlay } from '../components/prd-analysis/AnalyzingOverlay';
import { ApiKeyMissingBanner } from '../components/shared/ApiKeyMissingBanner';
import { NoProjectState } from '../components/shared/NoProjectState';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { PageLayout } from '../components/ui/PageLayout';

export function PrdAnalysisPage() {
  const { isProjectSelected, isLoading: isProjectLoading } = useRequireProject();
  const hasKey = useAuthStore((s) => s.user?.hasAnthropicApiKey ?? false);
  const openApiKeyGuard = useApiKeyGuard((s) => s.openApiKeyGuard);
  const startAnalysisMutation = useStartAnalysis();
  const { data: latestData } = useLatestPrdAnalysis();
  const { data: documentsData } = usePrdDocuments();
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const { data: detailData } = usePrdAnalysisDetail(selectedAnalysisId);

  const { data: historyData } = usePrdAnalysisHistory(1);
  const historyEntries = historyData?.data ?? [];

  const displayAnalysis = selectedAnalysisId
    ? (detailData?.data ?? null)
    : (latestData?.data ?? null);

  const currentDocument = (documentsData?.data ?? [])[0] ?? null;
  const hasDocument = currentDocument !== null;

  const completedEntries = historyEntries.filter((e) => e.status === 'completed');
  const previousRate =
    completedEntries.length >= 2 ? (completedEntries[1]?.overallRate ?? null) : null;

  const previousAnalysisId =
    completedEntries.length >= 2 ? (completedEntries[1]?.id ?? null) : null;

  const { data: previousDetailData } = usePrdAnalysisDetail(previousAnalysisId);
  const previousRequirements = previousDetailData?.data?.requirements ?? null;

  const handleStartAnalysis = (documentId: string) => {
    const runAnalysis = () => {
      startAnalysisMutation.mutate(documentId, {
        onSuccess: () => {
          showToast.success('Analysis completed');
          setSelectedAnalysisId(null);
        },
        onError: (err) => showToast.error(err.message),
      });
    };

    if (hasKey) {
      runAnalysis();
    } else {
      openApiKeyGuard(runAnalysis);
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
          <h1 className="text-2xl font-bold text-text-primary">PRD Tracker</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Upload a PRD document and track your codebase achievement rate
          </p>
        </div>
        <NoProjectState pageName="PRD Tracker" />
      </PageLayout>
    );
  }

  return (
    <>
      {hasDocument && (
        <PrdStickyDocumentBar
          document={currentDocument}
          lastAnalysis={latestData?.data ?? null}
          isAnalyzing={startAnalysisMutation.isPending}
          onStartAnalysis={handleStartAnalysis}
        />
      )}
      <PageLayout>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">PRD Tracker</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Upload a PRD document and track your codebase achievement rate
          </p>
        </div>

        <ApiKeyMissingBanner />

        {!hasDocument && (
          <Card>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
              PRD Document
            </h2>
            <p className="mb-3 text-xs text-text-tertiary">
              Upload your product requirements document to track implementation progress.
            </p>
            <PrdDocumentSection
              onStartAnalysis={handleStartAnalysis}
              isAnalyzing={startAnalysisMutation.isPending}
              latestAnalysis={latestData?.data ?? null}
            />
          </Card>
        )}

        {startAnalysisMutation.isPending && <AnalyzingOverlay />}

        {!startAnalysisMutation.isPending && displayAnalysis && (
          <>
            <Card>
              <PrdDashboard
                analysis={displayAnalysis}
                previousRate={previousRate}
                previousRequirements={previousRequirements}
                historyEntries={historyEntries}
              />
            </Card>

            <Card>
              <PrdRequirementList requirements={displayAnalysis.requirements} />
            </Card>
          </>
        )}

        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
            Analysis History
          </h2>
          <PrdAnalysisHistory onSelectAnalysis={setSelectedAnalysisId} />
        </Card>
      </PageLayout>
    </>
  );
}
