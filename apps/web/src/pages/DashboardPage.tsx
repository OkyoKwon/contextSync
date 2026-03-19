import { useTimeline, useDashboardStats } from '../hooks/use-sessions';
import { DashboardStatsView } from '../components/dashboard/DashboardStats';
import { Timeline } from '../components/dashboard/Timeline';
import { ActiveConflictsSidebar } from '../components/dashboard/ActiveConflictsSidebar';
import { Spinner } from '../components/ui/Spinner';

export function DashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: timelineData, isLoading: timelineLoading } = useTimeline();

  const stats = statsData?.data;
  const entries = timelineData?.data ?? [];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">Dashboard</h1>

      {statsLoading ? (
        <Spinner />
      ) : stats ? (
        <DashboardStatsView stats={stats} />
      ) : null}

      <div className="mt-6 grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Timeline</h2>
          <Timeline entries={entries} isLoading={timelineLoading} />
        </div>
        <div>
          <ActiveConflictsSidebar />
        </div>
      </div>
    </div>
  );
}
