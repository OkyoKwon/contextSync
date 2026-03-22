import type { ReactNode } from 'react';
import type { DashboardStats } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { CalendarIcon, TrendingUpIcon, WarningIcon, UsersIcon } from '../ui/icons';

interface DashboardStatsProps {
  stats: DashboardStats;
  isTeam?: boolean;
}

const statItems: readonly {
  readonly key: string;
  readonly label: string;
  readonly field: 'todaySessions' | 'weekSessions' | 'activeConflicts' | 'activeMembers';
  readonly color: string;
  readonly bgTint: string;
  readonly icon: typeof CalendarIcon;
  readonly tooltip?: ReactNode;
  readonly teamOnly?: boolean;
}[] = [
  {
    key: 'today',
    label: 'Today Sessions',
    field: 'todaySessions',
    color: 'text-blue-400',
    bgTint: 'bg-blue-500/5',
    icon: CalendarIcon,
  },
  {
    key: 'week',
    label: 'This Week',
    field: 'weekSessions',
    color: 'text-green-400',
    bgTint: 'bg-green-500/5',
    icon: TrendingUpIcon,
  },
  {
    key: 'conflicts',
    label: 'Active Conflicts',
    field: 'activeConflicts',
    color: 'text-red-400',
    bgTint: 'bg-red-500/5',
    icon: WarningIcon,
    tooltip: "Conflicts with 'detected' status that haven't been resolved yet.",
    teamOnly: true,
  },
  {
    key: 'members',
    label: 'Active Members',
    field: 'activeMembers',
    color: 'text-purple-400',
    bgTint: 'bg-purple-500/5',
    icon: UsersIcon,
    tooltip: 'Team members who created or updated sessions this week.',
    teamOnly: true,
  },
];

export function DashboardStatsView({ stats, isTeam = false }: DashboardStatsProps) {
  const visibleItems = isTeam ? statItems : statItems.filter((item) => !item.teamOnly);
  const gridCols = visibleItems.length >= 4 ? 'grid-cols-4' : `grid-cols-${visibleItems.length}`;

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {visibleItems.map(({ key, label, field, color, bgTint, icon: IconComponent, tooltip }) => (
        <Card key={key} className={bgTint}>
          <div className="flex items-center gap-2 mb-1">
            <IconComponent size={16} className={color} />
            <p className="text-xs font-medium uppercase text-text-tertiary">{label}</p>
            {tooltip && <Tooltip content={tooltip} position="bottom" />}
          </div>
          <p className={`text-2xl font-bold ${color}`}>{stats[field]}</p>
        </Card>
      ))}
    </div>
  );
}
