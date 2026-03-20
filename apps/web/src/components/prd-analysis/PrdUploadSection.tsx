import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import type { PrdDocument } from '@context-sync/shared';
import { SUPPORTED_PRD_EXTENSIONS, MAX_PRD_FILE_SIZE } from '@context-sync/shared';
import { usePrdDocuments, useUploadPrdDocument, useDeletePrdDocument } from '../../hooks/use-prd-analysis';

interface PrdUploadSectionProps {
  readonly onStartAnalysis: (documentId: string) => void;
  readonly isAnalyzing: boolean;
}

export function PrdUploadSection({ onStartAnalysis, isAnalyzing }: PrdUploadSectionProps) {
  const { data: documentsData } = usePrdDocuments();
  const uploadMutation = useUploadPrdDocument();
  const deleteMutation = useDeletePrdDocument();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const documents = documentsData?.data ?? [];

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!SUPPORTED_PRD_EXTENSIONS.includes(ext as typeof SUPPORTED_PRD_EXTENSIONS[number])) {
        toast.error(`Unsupported file type. Supported: ${SUPPORTED_PRD_EXTENSIONS.join(', ')}`);
        return;
      }

      if (file.size > MAX_PRD_FILE_SIZE) {
        toast.error(`File exceeds maximum size of ${MAX_PRD_FILE_SIZE / 1024}KB`);
        return;
      }

      uploadMutation.mutate(
        { file },
        {
          onSuccess: (res) => {
            toast.success('PRD document uploaded');
            if (res.data) setSelectedDocId(res.data.id);
          },
          onError: (err) => toast.error(err.message),
        },
      );
    },
    [uploadMutation],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxFiles: 1,
    disabled: uploadMutation.isPending,
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Document deleted');
        if (selectedDocId === id) setSelectedDocId(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleAnalyze = () => {
    if (!selectedDocId) {
      toast.error('Select a PRD document first');
      return;
    }
    onStartAnalysis(selectedDocId);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-400/5'
            : 'border-border-default hover:border-blue-400/50 hover:bg-surface-overlay'
        } ${uploadMutation.isPending ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <svg className="h-10 w-10 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-text-secondary">
            {isDragActive ? 'Drop your PRD file here' : 'Drag & drop a PRD file, or click to select'}
          </p>
          <p className="text-xs text-text-tertiary">
            Supported: {SUPPORTED_PRD_EXTENSIONS.join(', ')} (max {MAX_PRD_FILE_SIZE / 1024}KB)
          </p>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-secondary">Uploaded Documents</h3>
          <div className="space-y-1">
            {documents.map((doc: PrdDocument) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedDocId === doc.id
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-text-secondary hover:bg-surface-overlay'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate">{doc.title}</span>
                  <span className="shrink-0 text-xs text-text-tertiary">{doc.fileName}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(doc.id);
                  }}
                  className="shrink-0 rounded p-1 text-text-tertiary transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={!selectedDocId || isAnalyzing}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
      </button>
    </div>
  );
}
