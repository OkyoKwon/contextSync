import { useState } from 'react';
import { toast } from 'sonner';
import { useStartAnalysis, useLatestPrdAnalysis, usePrdAnalysisDetail, usePrdDocuments } from '../hooks/use-prd-analysis';
import { PrdDocumentSection } from '../components/prd-analysis/PrdDocumentSection';
import { PrdAnalysisResults } from '../components/prd-analysis/PrdAnalysisResults';
import { PrdRequirementList } from '../components/prd-analysis/PrdRequirementList';
import { PrdAnalysisHistory } from '../components/prd-analysis/PrdAnalysisHistory';
import { AnalyzingOverlay } from '../components/prd-analysis/AnalyzingOverlay';
import { Card } from '../components/ui/Card';

export function PrdAnalysisPage() {
  const startAnalysisMutation = useStartAnalysis();
  const { data: latestData, isLoading: isLoadingLatest } = useLatestPrdAnalysis();
  const { data: documentsData } = usePrdDocuments();
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const { data: detailData } = usePrdAnalysisDetail(selectedAnalysisId);

  const displayAnalysis = selectedAnalysisId
    ? detailData?.data ?? null
    : latestData?.data ?? null;

  const hasDocument = (documentsData?.data ?? []).length > 0;

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

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
          PRD Document
        </h2>
        <PrdDocumentSection
          onStartAnalysis={handleStartAnalysis}
          isAnalyzing={startAnalysisMutation.isPending}
          latestAnalysis={latestData?.data ?? null}
        />
      </Card>

      {startAnalysisMutation.isPending && <AnalyzingOverlay />}

      {!startAnalysisMutation.isPending && displayAnalysis && (
        <>
          <Card>
            <PrdAnalysisResults analysis={displayAnalysis} />
          </Card>

          <Card>
            <PrdRequirementList requirements={displayAnalysis.requirements} />
          </Card>
        </>
      )}

      {!startAnalysisMutation.isPending && !displayAnalysis && !isLoadingLatest && (
        <Card padding="lg" className="text-center text-sm text-text-tertiary">
          {hasDocument
            ? 'Document uploaded. Click Re-analyze to start.'
            : 'Upload a PRD document to get started.'}
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
          Analysis History
        </h2>
        <PrdAnalysisHistory onSelectAnalysis={setSelectedAnalysisId} />
      </Card>
    </div>
  );
}
