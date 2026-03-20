import { useState } from 'react';
import { toast } from 'sonner';
import type { PrdAnalysisWithRequirements } from '@context-sync/shared';
import { usePrdDocuments, useUploadPrdDocument, useReplacePrdDocument } from '../../hooks/use-prd-analysis';
import { PrdDropZone } from './PrdDropZone';
import { PrdCurrentDocument } from './PrdCurrentDocument';

interface PrdDocumentSectionProps {
  readonly onStartAnalysis: (documentId: string) => void;
  readonly isAnalyzing: boolean;
  readonly latestAnalysis: PrdAnalysisWithRequirements | null;
}

export function PrdDocumentSection({
  onStartAnalysis,
  isAnalyzing,
  latestAnalysis,
}: PrdDocumentSectionProps) {
  const { data: documentsData, isLoading } = usePrdDocuments();
  const uploadMutation = useUploadPrdDocument();
  const replaceMutation = useReplacePrdDocument();
  const [isChangingFile, setIsChangingFile] = useState(false);

  const documents = documentsData?.data ?? [];
  const currentDocument = documents[0] ?? null;

  const handleUpload = (file: File) => {
    uploadMutation.mutate(
      { file },
      {
        onSuccess: () => {
          toast.success('PRD document uploaded');
          setIsChangingFile(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleReplace = (file: File) => {
    if (!currentDocument) return;

    replaceMutation.mutate(
      { oldDocumentId: currentDocument.id, file },
      {
        onSuccess: () => {
          toast.success('PRD document replaced. Previous analysis results are preserved.');
          setIsChangingFile(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleReanalyze = () => {
    if (!currentDocument) return;
    onStartAnalysis(currentDocument.id);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-5 w-32 rounded bg-surface-hover" />
        <div className="h-4 w-48 rounded bg-surface-hover" />
        <div className="flex justify-end gap-2">
          <div className="h-8 w-20 rounded-lg bg-surface-hover" />
          <div className="h-8 w-28 rounded-lg bg-surface-hover" />
        </div>
      </div>
    );
  }

  // No document: full dropzone
  if (!currentDocument) {
    return (
      <div className="transition-opacity">
        <PrdDropZone
          onFileDrop={handleUpload}
          isUploading={uploadMutation.isPending}
        />
      </div>
    );
  }

  // Changing file: compact dropzone + cancel
  if (isChangingFile) {
    return (
      <div className="space-y-3 transition-opacity">
        <PrdDropZone
          compact
          onFileDrop={handleReplace}
          isUploading={replaceMutation.isPending}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-tertiary">Previous analysis results will be preserved</p>
          <button
            type="button"
            onClick={() => setIsChangingFile(false)}
            className="text-sm text-text-tertiary underline hover:text-text-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Document exists: show document info + actions
  return (
    <div className="transition-opacity">
      <PrdCurrentDocument
        document={currentDocument}
        onChangeFile={() => setIsChangingFile(true)}
        onReanalyze={handleReanalyze}
        isAnalyzing={isAnalyzing}
        lastAnalysis={latestAnalysis}
      />
    </div>
  );
}
