import { useState } from 'react';
import { useTimeline, useDashboardStats, useDeleteSession } from '../hooks/use-sessions';
import { useAuthStore } from '../stores/auth.store';
import { useCurrentProject } from '../hooks/use-current-project';
import { useRequireProject } from '../hooks/use-require-project';
import { DashboardStatsView } from '../components/dashboard/DashboardStats';
import { Timeline } from '../components/dashboard/Timeline';
import { ActiveConflictsSidebar } from '../components/dashboard/ActiveConflictsSidebar';
import { HotFiles } from '../components/dashboard/HotFiles';
import { TokenUsagePanel } from '../components/dashboard/TokenUsagePanel';
import { TeamActivityPanel } from '../components/dashboard/TeamActivityPanel';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { EmptyDashboard } from '../components/dashboard/EmptyDashboard';
import { NoProjectState } from '../components/shared/NoProjectState';
import { Spinner } from '../components/ui/Spinner';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { getGreeting } from '../lib/date';
import { PageBreadcrumb } from '../components/layout/PageBreadcrumb';
import { DeleteSessionModal } from '../components/sessions/DeleteSessionModal';
import { showToast } from '../lib/toast';
export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { isProjectSelected, isLoading: isProjectLoading } = useRequireProject();

  const [deleteTarget, setDeleteTarget] = useState<{
    readonly id: string;
    readonly title: string;
  } | null>(null);
  const deleteMutation = useDeleteSession();

  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: timelineData, isLoading: timelineLoading } = useTimeline();
  const { data: projectData } = useCurrentProject();

  const isTeam = projectData?.data?.isTeam ?? false;

  const stats = statsData?.data;

  const entries = timelineData?.data ?? [];

  const greeting = getGreeting(new Date().getHours());
  const displayName = user?.name?.split(' ')[0] ?? 'there';

  if (isProjectLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isProjectSelected) {
    return (
      <div>
        <div className="mb-6">
          <PageBreadcrumb pageName="Dashboard" />
          <p className="mt-1 text-sm text-text-secondary">
            {greeting}, {displayName}
          </p>
        </div>
        <NoProjectState pageName="Dashboard" />
      </div>
    );
  }

  const isDataLoading = timelineLoading || statsLoading;
  const hasSessions = entries.length > 0;

  // 데이터 로딩 중이면 스켈레톤 표시 (EmptyDashboard 플래시 방지)
  if (isDataLoading) {
    return (
      <div>
        <div className="mb-6">
          <PageBreadcrumb pageName="Dashboard" />
          <p className="mt-1 text-sm text-text-secondary">
            {greeting}, {displayName}
          </p>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  if (!hasSessions) {
    return (
      <div>
        <div className="mb-6">
          <PageBreadcrumb pageName="Dashboard" />
          <p className="mt-1 text-sm text-text-secondary">
            {greeting}, {displayName}
          </p>
        </div>
        <EmptyDashboard hasProject hasSessions={false} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <PageBreadcrumb pageName="Dashboard" />
        <p className="mt-1 text-sm text-text-secondary">
          {greeting}, {displayName}
          {stats && (
            <span className="text-text-tertiary">
              {' · '}
              {stats.todaySessions} session{stats.todaySessions !== 1 ? 's' : ''} today
              {isTeam && (
                <>
                  , {stats.activeConflicts} active conflict
                  {stats.activeConflicts !== 1 ? 's' : ''}
                </>
              )}
            </span>
          )}
        </p>
      </div>

      {stats ? <DashboardStatsView stats={stats} isTeam={isTeam} /> : null}

      <div className="mt-6">
        <TokenUsagePanel />
      </div>

      {isTeam ? (
        <div className="mt-6 grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-text-secondary">Timeline</h2>
            </div>
            <Timeline
              entries={entries}
              isLoading={timelineLoading}
              onDeleteSession={(id, title) => setDeleteTarget({ id, title })}
            />
          </div>
          <div className="space-y-4">
            <TeamActivityPanel />
            <ActiveConflictsSidebar />
            {stats && <HotFiles hotFilePaths={stats.hotFilePaths} />}
            <ActivityFeed />
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {stats && <HotFiles hotFilePaths={stats.hotFilePaths} />}
          <div>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-text-secondary">Timeline</h2>
            </div>
            <Timeline
              entries={entries}
              isLoading={timelineLoading}
              onDeleteSession={(id, title) => setDeleteTarget({ id, title })}
            />
          </div>
        </div>
      )}

      <DeleteSessionModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              showToast.success('Session deleted');
              setDeleteTarget(null);
            },
            onError: (err) =>
              showToast.error(err instanceof Error ? err.message : 'Failed to delete session'),
          });
        }}
        isDeleting={deleteMutation.isPending}
        sessionTitle={deleteTarget?.title ?? ''}
      />
    </div>
  );
}
