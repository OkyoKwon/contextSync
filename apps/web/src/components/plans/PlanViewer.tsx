import { useState } from 'react';
import type { PlanDetail } from '@context-sync/shared';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';

interface PlanViewerProps {
  readonly plan: PlanDetail;
  readonly onDelete: (filename: string) => void;
  readonly isDeleting: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function PlanViewer({ plan, onDelete, isDeleting }: PlanViewerProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([plan.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = plan.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    onDelete(plan.filename);
    setShowConfirm(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b border-border-default px-6 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-text-primary">{plan.title}</h2>
          <div className="mt-1 flex items-center gap-2 text-xs text-text-tertiary">
            <span>{plan.filename}</span>
            <span>·</span>
            <span>{formatFileSize(plan.sizeBytes)}</span>
            <span>·</span>
            <span>{new Date(plan.lastModifiedAt).toLocaleString()}</span>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          {showConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-tertiary">Delete?</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-interactive-hover"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-interactive-hover"
              >
                Download
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <MarkdownRenderer content={plan.content} />
      </div>
    </div>
  );
}
