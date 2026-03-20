import { Card } from '../ui/Card';
import { FileIcon } from '../ui/icons';

interface HotFilesProps {
  readonly hotFilePaths: readonly { readonly path: string; readonly count: number }[];
}

export function HotFiles({ hotFilePaths }: HotFilesProps) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <FileIcon size={16} className="text-text-tertiary" />
        <h3 className="text-sm font-semibold text-text-primary">Hot Files</h3>
      </div>

      {hotFilePaths.length === 0 ? (
        <p className="text-xs text-text-tertiary">
          File activity will appear as sessions are imported
        </p>
      ) : (
        <div className="space-y-1.5">
          {hotFilePaths.slice(0, 8).map(({ path, count }) => (
            <div key={path} className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-xs text-text-secondary">{path}</span>
              <span className="shrink-0 text-xs tabular-nums text-text-muted">{count}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
