import { useState } from 'react';
import { toast } from 'sonner';
import { useStartAnalysis, useLatestPrdAnalysis, usePrdAnalysisDetail } from '../hooks/use-prd-analysis';
import { PrdUploadSection } from '../components/prd-analysis/PrdUploadSection';
import { PrdAnalysisResults } from '../components/prd-analysis/PrdAnalysisResults';
import { PrdRequirementList } from '../components/prd-analysis/PrdRequirementList';
import { PrdAnalysisHistory } from '../components/prd-analysis/PrdAnalysisHistory';
import { AnalyzingOverlay } from '../components/prd-analysis/AnalyzingOverlay';

export function PrdAnalysisPage() {
  const startAnalysisMutation = useStartAnalysis();
  const { data: latestData, isLoading: isLoadingLatest } = useLatestPrdAnalysis();
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const { data: detailData } = usePrdAnalysisDetail(selectedAnalysisId);

  const displayAnalysis = selectedAnalysisId
    ? detailData?.data ?? null
    : latestData?.data ?? null;

  const handleStartAnalysis = (documentId: string) => {
    startAnalysisMutation.mutate(documentId, {
      onSuccess: () => {
        toast.success('Analysis completed');
        setSelectedAnalysisId(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">PRD Tracker</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Upload a PRD document and track your codebase achievement rate
        </p>
      </div>

      <div className="rounded-lg border border-border-default bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
          Upload & Analyze
        </h2>
        <PrdUploadSection
          onStartAnalysis={handleStartAnalysis}
          isAnalyzing={startAnalysisMutation.isPending}
        />
      </div>

      {startAnalysisMutation.isPending && <AnalyzingOverlay />}

      {!startAnalysisMutation.isPending && displayAnalysis && (
        <>
          <div className="rounded-lg border border-border-default bg-surface p-4">
            <PrdAnalysisResults analysis={displayAnalysis} />
          </div>

          <div className="rounded-lg border border-border-default bg-surface p-4">
            <PrdRequirementList requirements={displayAnalysis.requirements} />
          </div>
        </>
      )}

      {!startAnalysisMutation.isPending && !displayAnalysis && !isLoadingLatest && (
        <div className="rounded-lg border border-border-default bg-surface p-8 text-center text-sm text-text-tertiary">
          No analysis results yet. Upload a PRD document and start your first analysis.
        </div>
      )}

      <div className="rounded-lg border border-border-default bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
          Analysis History
        </h2>
        <PrdAnalysisHistory onSelectAnalysis={setSelectedAnalysisId} />
      </div>
    </div>
  );
}
