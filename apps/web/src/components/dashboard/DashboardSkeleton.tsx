import { Skeleton } from '../ui/Skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-border-default bg-surface p-4">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-xl border border-border-default bg-surface p-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="mb-1 h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Timeline */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-3">
          <Skeleton className="h-4 w-16" />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="rounded-xl border border-border-default bg-surface p-4">
              <Skeleton className="mb-2 h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="rounded-xl border border-border-default bg-surface p-4">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
