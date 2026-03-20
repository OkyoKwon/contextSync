import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { SessionSource } from '@context-sync/shared';
import { useTimeline, useDashboardStats } from '../hooks/use-sessions';
import { useAuthStore } from '../stores/auth.store';
import { useCurrentProject } from '../hooks/use-current-project';
import { useRequireProject } from '../hooks/use-require-project';
import { DashboardStatsView } from '../components/dashboard/DashboardStats';
import { Timeline } from '../components/dashboard/Timeline';
import { TimelineFilters } from '../components/dashboard/TimelineFilters';
import { ActiveConflictsSidebar } from '../components/dashboard/ActiveConflictsSidebar';
import { HotFiles } from '../components/dashboard/HotFiles';
import { TokenUsagePanel } from '../components/dashboard/TokenUsagePanel';
import { TeamActivityPanel } from '../components/dashboard/TeamActivityPanel';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { EmptyDashboard } from '../components/dashboard/EmptyDashboard';
import { NoProjectState } from '../components/shared/NoProjectState';
import { Spinner } from '../components/ui/Spinner';
import { getGreeting } from '../lib/date';
import { PageBreadcrumb } from '../components/layout/PageBreadcrumb';

const VALID_SOURCES: ReadonlySet<string> = new Set(['claude_code', 'claude_ai', 'api', 'manual']);

function parseSourceParam(value: string | null): SessionSource | null {
  if (value && VALID_SOURCES.has(value)) return value as SessionSource;
  return null;
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { isProjectSelected, isLoading: isProjectLoading } = useRequireProject();

  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: timelineData, isLoading: timelineLoading } = useTimeline();
  const { data: projectData } = useCurrentProject();

  const isTeam = projectData?.data?.isTeam ?? false;

  const [searchParams, setSearchParams] = useSearchParams();
  const activeSource = parseSourceParam(searchParams.get('source'));

  const handleFilterChange = useCallback(
    (source: SessionSource | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (source) {
          next.set('source', source);
        } else {
          next.delete('source');
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const stats = statsData?.data;
  const allEntries = timelineData?.data ?? [];

  const filteredEntries = useMemo(
    () => activeSource ? allEntries.filter((e) => e.source === activeSource) : allEntries,
    [allEntries, activeSource],
  );

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
          <p className="mt-1 text-sm text-text-secondary">{greeting}, {displayName}</p>
        </div>
        <NoProjectState pageName="Dashboard" />
      </div>
    );
  }

  const hasSessions = allEntries.length > 0 || timelineLoading;

  if (!timelineLoading && !hasSessions) {
    return (
      <div>
        <div className="mb-6">
          <PageBreadcrumb pageName="Dashboard" />
          <p className="mt-1 text-sm text-text-secondary">{greeting}, {displayName}</p>
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
              {' · '}{stats.todaySessions} session{stats.todaySessions !== 1 ? 's' : ''} today, {stats.activeConflicts} active conflict{stats.activeConflicts !== 1 ? 's' : ''}
            </span>
          )}
        </p>
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
            <TimelineFilters activeSource={activeSource} onFilterChange={handleFilterChange} />
          </div>
          <Timeline entries={filteredEntries} isLoading={timelineLoading} />
        </div>
        <div className="space-y-4">
          {isTeam && <TeamActivityPanel />}
          <ActiveConflictsSidebar />
          {stats && <HotFiles hotFilePaths={stats.hotFilePaths} />}
          {isTeam && <ActivityFeed />}
        </div>
      </div>
    </div>
  );
}
