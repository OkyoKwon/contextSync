import type { DashboardStats } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { CalendarIcon, TrendingUpIcon, WarningIcon, UsersIcon } from '../ui/icons';

interface DashboardStatsProps {
  stats: DashboardStats;
}

const statItems = [
  { key: 'today', label: 'Today Sessions', field: 'todaySessions', color: 'text-blue-400', bgTint: 'bg-blue-500/5', icon: CalendarIcon },
  { key: 'week', label: 'This Week', field: 'weekSessions', color: 'text-green-400', bgTint: 'bg-green-500/5', icon: TrendingUpIcon },
  { key: 'conflicts', label: 'Active Conflicts', field: 'activeConflicts', color: 'text-red-400', bgTint: 'bg-red-500/5', icon: WarningIcon },
  { key: 'members', label: 'Active Members', field: 'activeMembers', color: 'text-purple-400', bgTint: 'bg-purple-500/5', icon: UsersIcon },
] as const;

export function DashboardStatsView({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {statItems.map(({ key, label, field, color, bgTint, icon: IconComponent }) => (
        <Card key={key} className={bgTint}>
          <div className="flex items-center gap-2 mb-1">
            <IconComponent size={16} className={color} />
            <p className="text-xs font-medium uppercase text-text-tertiary">{label}</p>
          </div>
          <p className={`text-2xl font-bold ${color}`}>{stats[field]}</p>
        </Card>
      ))}
    </div>
  );
}
