import { useState } from 'react';
import { toast } from 'sonner';
import type { PrdDocument, PrdAnalysisWithRequirements } from '@context-sync/shared';
import { useReplacePrdDocument } from '../../hooks/use-prd-analysis';
import { Button } from '../ui/Button';
import { PrdDropZone } from './PrdDropZone';

interface PrdStickyDocumentBarProps {
  readonly document: PrdDocument;
  readonly lastAnalysis: PrdAnalysisWithRequirements | null;
  readonly isAnalyzing: boolean;
  readonly onStartAnalysis: (documentId: string) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function PrdStickyDocumentBar({
  document,
  lastAnalysis,
  isAnalyzing,
  onStartAnalysis,
}: PrdStickyDocumentBarProps) {
  const [isChangingFile, setIsChangingFile] = useState(false);
  const replaceMutation = useReplacePrdDocument();

  const handleReplace = (file: File) => {
    replaceMutation.mutate(
      { oldDocumentId: document.id, file },
      {
        onSuccess: () => {
          toast.success('PRD document replaced. Previous analysis results are preserved.');
          setIsChangingFile(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleAnalyze = () => {
    onStartAnalysis(document.id);
  };

  const analyzeLabel = isAnalyzing
    ? 'Analyzing...'
    : lastAnalysis
      ? 'Re-analyze'
      : 'Analyze';

  return (
    <div className="sticky top-0 z-10 -mx-6 border-b border-border-default bg-page/95 px-6 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        <svg className="h-5 w-5 shrink-0 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
          {document.fileName}
        </span>
        {lastAnalysis?.completedAt && (
          <span className="hidden shrink-0 text-xs text-text-tertiary sm:inline">
            Last analyzed: {formatDate(lastAnalysis.completedAt)}
          </span>
        )}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsChangingFile((prev) => !prev)}
            disabled={isAnalyzing}
          >
            {isChangingFile ? 'Cancel' : 'Change File'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {analyzeLabel}
          </Button>
        </div>
      </div>
      {isChangingFile && (
        <div className="mx-auto mt-3 max-w-4xl space-y-2">
          <PrdDropZone compact onFileDrop={handleReplace} isUploading={replaceMutation.isPending} />
          <p className="text-xs text-text-tertiary">Previous analysis results will be preserved</p>
        </div>
      )}
    </div>
  );
}
