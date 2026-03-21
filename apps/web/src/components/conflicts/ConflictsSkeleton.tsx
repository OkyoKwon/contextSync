import { Skeleton } from '../ui/Skeleton';

export function ConflictsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="rounded-xl border border-border-default bg-surface p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="mt-2 h-4 w-64" />
          <Skeleton className="mt-1 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
