import { useMemo, useState } from 'react';
import type { SessionSource } from '@context-sync/shared';
import { useTimeline, useDashboardStats } from '../hooks/use-sessions';
import { useAuthStore } from '../stores/auth.store';
import { DashboardStatsView } from '../components/dashboard/DashboardStats';
import { Timeline } from '../components/dashboard/Timeline';
import { TimelineFilters } from '../components/dashboard/TimelineFilters';
import { ActiveConflictsSidebar } from '../components/dashboard/ActiveConflictsSidebar';
import { HotFiles } from '../components/dashboard/HotFiles';
import { TokenUsagePanel } from '../components/dashboard/TokenUsagePanel';
import { EmptyDashboard } from '../components/dashboard/EmptyDashboard';
import { Spinner } from '../components/ui/Spinner';
import { getGreeting } from '../lib/date';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const currentProjectId = useAuthStore((s) => s.currentProjectId);

  const isProjectSelected = currentProjectId !== null && currentProjectId !== 'skipped';

  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: timelineData, isLoading: timelineLoading } = useTimeline();
  const [activeSource, setActiveSource] = useState<SessionSource | null>(null);

  const stats = statsData?.data;
  const allEntries = timelineData?.data ?? [];

  const filteredEntries = useMemo(
    () => activeSource ? allEntries.filter((e) => e.source === activeSource) : allEntries,
    [allEntries, activeSource],
  );

  const greeting = getGreeting(new Date().getHours());
  const displayName = user?.name?.split(' ')[0] ?? 'there';

  if (!isProjectSelected) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text-primary">
            {greeting}, {displayName}
          </h1>
        </div>
        <EmptyDashboard />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">
          {greeting}, {displayName}
        </h1>
        {stats && (
          <p className="mt-1 text-sm text-text-secondary">
            {stats.todaySessions} session{stats.todaySessions !== 1 ? 's' : ''} today, {stats.activeConflicts} active conflict{stats.activeConflicts !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {statsLoading ? (
        <Spinner />
      ) : stats ? (
        <DashboardStatsView stats={stats} />
      ) : null}

      <div className="mt-6">
        <TokenUsagePanel />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-text-secondary">Timeline</h2>
            <TimelineFilters activeSource={activeSource} onFilterChange={setActiveSource} />
          </div>
          <Timeline entries={filteredEntries} isLoading={timelineLoading} />
        </div>
        <div className="space-y-4">
          <ActiveConflictsSidebar />
          {stats && <HotFiles hotFilePaths={stats.hotFilePaths} />}
        </div>
      </div>
    </div>
  );
}
