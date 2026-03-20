import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { SUPPORTED_PRD_EXTENSIONS, MAX_PRD_FILE_SIZE } from '@context-sync/shared';

interface PrdDropZoneProps {
  readonly onFileDrop: (file: File) => void;
  readonly isUploading: boolean;
  readonly compact?: boolean;
}

export function PrdDropZone({ onFileDrop, isUploading, compact = false }: PrdDropZoneProps) {
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

      onFileDrop(file);
    },
    [onFileDrop],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      role="button"
      aria-label="PRD 문서 업로드"
      className={`cursor-pointer rounded-lg border-2 border-dashed text-center transition-colors ${
        compact ? 'p-4 sm:p-6' : 'p-6 sm:p-8'
      } ${
        isDragActive
          ? 'border-blue-400 bg-blue-400/5'
          : 'border-border-default hover:border-blue-400/50 hover:bg-surface-overlay'
      } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        {!compact && (
          <svg className="h-10 w-10 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        )}
        <p className="text-sm text-text-secondary">
          {isDragActive ? 'Drop your PRD file here' : 'Drag & drop a PRD file, or click to select'}
        </p>
        <p className="text-xs text-text-tertiary">
          Supported: {SUPPORTED_PRD_EXTENSIONS.join(', ')} (max {MAX_PRD_FILE_SIZE / 1024}KB)
        </p>
      </div>
      {isDragActive && (
        <div role="status" aria-live="polite" className="sr-only">
          Drop the file to upload
        </div>
      )}
    </div>
  );
}
