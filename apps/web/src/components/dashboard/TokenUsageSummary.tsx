import type { TokenUsageStats } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { ZapIcon, DollarIcon, CpuIcon } from '../ui/icons';
import { formatTokenCount, formatUSD } from '../../lib/format';

interface TokenUsageSummaryProps {
  readonly stats: TokenUsageStats;
}

export function TokenUsageSummary({ stats }: TokenUsageSummaryProps) {
  const topModel = stats.modelBreakdown[0]?.model ?? 'N/A';

  const items = [
    {
      key: 'tokens',
      label: 'Total Tokens',
      value: formatTokenCount(stats.totalTokens),
      color: 'text-amber-400',
      bgTint: 'bg-amber-500/5',
      icon: ZapIcon,
    },
    {
      key: 'cost',
      label: 'Estimated Cost',
      value: formatUSD(stats.totalCost),
      color: 'text-emerald-400',
      bgTint: 'bg-emerald-500/5',
      icon: DollarIcon,
    },
    {
      key: 'model',
      label: 'Top Model',
      value: topModel,
      color: 'text-violet-400',
      bgTint: 'bg-violet-500/5',
      icon: CpuIcon,
    },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map(({ key, label, value, color, bgTint, icon: IconComponent }) => (
        <Card key={key} className={bgTint}>
          <div className="flex items-center gap-2 mb-1">
            <IconComponent size={16} className={color} />
            <p className="text-xs font-medium uppercase text-text-tertiary">{label}</p>
          </div>
          <p className={`text-2xl font-bold ${color} truncate`}>{value}</p>
        </Card>
      ))}
    </div>
  );
}
