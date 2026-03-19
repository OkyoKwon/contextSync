import type { DashboardStats } from '@context-sync/shared';
import { Card } from '../ui/Card';

interface DashboardStatsProps {
  stats: DashboardStats;
}

export function DashboardStatsView({ stats }: DashboardStatsProps) {
  const items = [
    { label: 'Today Sessions', value: stats.todaySessions, color: 'text-blue-600' },
    { label: 'This Week', value: stats.weekSessions, color: 'text-green-600' },
    { label: 'Active Conflicts', value: stats.activeConflicts, color: 'text-red-600' },
    { label: 'Active Members', value: stats.activeMembers, color: 'text-purple-600' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <p className="text-xs font-medium uppercase text-gray-500">{item.label}</p>
          <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
