import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useImportSession } from '../../hooks/use-sessions';

interface SessionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SessionUploadModal({ isOpen, onClose }: SessionUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const importMutation = useImportSession();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json', '.jsonl'],
      'text/markdown': ['.md'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    await importMutation.mutateAsync(selectedFile);
    setSelectedFile(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Session">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive ? 'border-blue-400 bg-blue-500/10' : 'border-zinc-700 hover:border-zinc-600'
        }`}
      >
        <input {...getInputProps()} />
        {selectedFile ? (
          <div>
            <p className="text-sm font-medium text-[#FAFAFA]">{selectedFile.name}</p>
            <p className="text-xs text-[#A1A1AA]">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-[#A1A1AA]">
              Drop a .json, .jsonl, or .md file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-[#71717A]">Max 10MB</p>
          </div>
        )}
      </div>

      {importMutation.error && (
        <p className="mt-3 text-sm text-red-400">
          {importMutation.error instanceof Error ? importMutation.error.message : 'Upload failed'}
        </p>
      )}

      {importMutation.data?.data && (
        <div className="mt-3 rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
          Imported {importMutation.data.data.messageCount} messages.
          {importMutation.data.data.detectedConflicts > 0 &&
            ` ${importMutation.data.data.detectedConflicts} conflict(s) detected.`}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || importMutation.isPending}
        >
          {importMutation.isPending ? <Spinner size="sm" /> : 'Upload'}
        </Button>
      </div>
    </Modal>
  );
}
