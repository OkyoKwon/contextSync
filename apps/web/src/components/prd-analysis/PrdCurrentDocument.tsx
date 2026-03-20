import type { PrdDocument, PrdAnalysisWithRequirements } from '@context-sync/shared';
import { Button } from '../ui/Button';

interface PrdCurrentDocumentProps {
  readonly document: PrdDocument;
  readonly onChangeFile: () => void;
  readonly onReanalyze: () => void;
  readonly isAnalyzing: boolean;
  readonly lastAnalysis: PrdAnalysisWithRequirements | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function PrdCurrentDocument({
  document,
  onChangeFile,
  onReanalyze,
  isAnalyzing,
  lastAnalysis,
}: PrdCurrentDocumentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-text-primary">{document.title}</p>
          <p className="text-sm text-text-tertiary">
            {document.fileName}  ·  Uploaded: {formatDate(document.createdAt)}
          </p>
          {lastAnalysis?.completedAt != null && lastAnalysis.overallRate != null && (
            <p className="mt-1 text-xs text-text-tertiary">
              Last analyzed: {formatDate(lastAnalysis.completedAt)} — {lastAnalysis.overallRate}%
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onChangeFile}
          disabled={isAnalyzing}
        >
          Change File
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onReanalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
        </Button>
      </div>
    </div>
  );
}
