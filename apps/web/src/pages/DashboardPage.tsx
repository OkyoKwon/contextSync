import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { SessionSource } from '@context-sync/shared';
import { useTimeline, useDashboardStats } from '../hooks/use-sessions';
import { useAuthStore } from '../stores/auth.store';
import { sessionsApi } from '../api/sessions.api';
import { DashboardStatsView } from '../components/dashboard/DashboardStats';
import { Timeline } from '../components/dashboard/Timeline';
import { TimelineFilters } from '../components/dashboard/TimelineFilters';
import { ActiveConflictsSidebar } from '../components/dashboard/ActiveConflictsSidebar';
import { HotFiles } from '../components/dashboard/HotFiles';
import { TokenUsagePanel } from '../components/dashboard/TokenUsagePanel';
import { EmptyDashboard } from '../components/dashboard/EmptyDashboard';
import { Spinner } from '../components/ui/Spinner';
import { getGreeting } from '../lib/date';
import { showToast } from '../lib/toast';

const VALID_SOURCES: ReadonlySet<string> = new Set(['claude_code', 'claude_ai', 'api', 'manual']);

function parseSourceParam(value: string | null): SessionSource | null {
  if (value && VALID_SOURCES.has(value)) return value as SessionSource;
  return null;
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const currentProjectId = useAuthStore((s) => s.currentProjectId);

  const isProjectSelected = currentProjectId !== null && currentProjectId !== 'skipped';

  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: timelineData, isLoading: timelineLoading } = useTimeline();

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

  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!currentProjectId || exporting) return;
    setExporting(true);
    try {
      const blob = await sessionsApi.exportMarkdown(currentProjectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sessions-export.md';
      a.click();
      URL.revokeObjectURL(url);
      showToast.success('Markdown exported successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      showToast.error(message);
    } finally {
      setExporting(false);
    }
  }, [currentProjectId, exporting]);

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
        <EmptyDashboard hasProject={false} hasSessions={false} />
      </div>
    );
  }

  const hasSessions = allEntries.length > 0 || timelineLoading;

  if (!timelineLoading && !hasSessions) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text-primary">
            {greeting}, {displayName}
          </h1>
        </div>
        <EmptyDashboard hasProject hasSessions={false} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            {greeting}, {displayName}
          </h1>
          {stats && (
            <p className="mt-1 text-sm text-text-secondary">
              {stats.todaySessions} session{stats.todaySessions !== 1 ? 's' : ''} today, {stats.activeConflicts} active conflict{stats.activeConflicts !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 rounded-md border border-border-primary bg-bg-secondary px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary disabled:opacity-50"
        >
          {exporting ? (
            <Spinner size="sm" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
          )}
          Export Markdown
        </button>
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
          <ActiveConflictsSidebar />
          {stats && <HotFiles hotFilePaths={stats.hotFilePaths} />}
        </div>
      </div>
    </div>
  );
}
