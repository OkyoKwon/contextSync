import { Skeleton } from '../ui/Skeleton';

export function SessionListSkeleton() {
  return (
    <div className="space-y-4 p-3">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i}>
          <div className="mb-1.5 rounded-lg border border-border-default bg-surface p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
          <div className="ml-2 space-y-1 border-l border-border-default pl-3">
            {Array.from({ length: 2 }, (_, j) => (
              <div key={j} className="rounded-lg border border-border-default p-2.5">
                <Skeleton className="mb-1 h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
