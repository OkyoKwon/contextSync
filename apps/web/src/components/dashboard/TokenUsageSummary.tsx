import type { ReactNode } from 'react';
import type { TokenUsageStats } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { ZapIcon, DollarIcon, CpuIcon } from '../ui/icons';
import { formatTokenCount, formatUSD } from '../../lib/format';

interface TokenUsageSummaryProps {
  readonly stats: TokenUsageStats;
}

export function TokenUsageSummary({ stats }: TokenUsageSummaryProps) {
  const topModel = stats.modelBreakdown[0]?.model ?? 'N/A';

  const items: readonly {
    readonly key: string;
    readonly label: string;
    readonly value: string;
    readonly color: string;
    readonly bgTint: string;
    readonly icon: typeof ZapIcon;
    readonly tooltip: ReactNode;
  }[] = [
    {
      key: 'tokens',
      label: 'Total Tokens',
      value: formatTokenCount(stats.totalTokens),
      color: 'text-amber-400',
      bgTint: 'bg-amber-500/5',
      icon: ZapIcon,
      tooltip: 'Total input and output tokens across all sessions in the selected period.',
    },
    {
      key: 'cost',
      label: 'Estimated Cost',
      value: formatUSD(stats.totalCost),
      color: 'text-emerald-400',
      bgTint: 'bg-emerald-500/5',
      icon: DollarIcon,
      tooltip: 'Estimated using average blended input/output rates per model. Actual costs depend on your Anthropic plan and token split.',
    },
    {
      key: 'model',
      label: 'Top Model',
      value: topModel,
      color: 'text-violet-400',
      bgTint: 'bg-violet-500/5',
      icon: CpuIcon,
      tooltip: 'The model with the highest token usage in the selected period.',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map(({ key, label, value, color, bgTint, icon: IconComponent, tooltip }) => (
        <Card key={key} className={bgTint}>
          <div className="flex items-center gap-2 mb-1">
            <IconComponent size={16} className={color} />
            <p className="text-xs font-medium uppercase text-text-tertiary">{label}</p>
            <Tooltip content={tooltip} position="bottom" />
          </div>
          <p className={`text-2xl font-bold ${color} truncate`}>{value}</p>
        </Card>
      ))}
    </div>
  );
}
