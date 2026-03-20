import { useState } from 'react';
import type { DailyTokenUsage } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { formatTokenCount, formatUSD } from '../../lib/format';

interface DailyUsageChartProps {
  readonly dailyUsage: readonly DailyTokenUsage[];
}

const MODEL_COLORS: Readonly<Record<string, string>> = {
  'claude-opus-4': '#c084fc',
  'claude-sonnet-4': '#60a5fa',
  'claude-haiku-4': '#34d399',
  'claude-3-5-sonnet': '#f472b6',
  'claude-3-5-haiku': '#fbbf24',
  'claude-3-opus': '#a78bfa',
  'claude-3-sonnet': '#38bdf8',
  'claude-3-haiku': '#4ade80',
};

const FALLBACK_COLORS = ['#94a3b8', '#fb923c', '#e879f9', '#2dd4bf'];

function getModelColor(model: string, index: number): string {
  return MODEL_COLORS[model] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] ?? '#94a3b8';
}

export function DailyUsageChart({ dailyUsage }: DailyUsageChartProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  if (dailyUsage.length === 0) {
    return (
      <Card>
        <p className="text-sm text-text-tertiary text-center py-4">No daily usage data</p>
      </Card>
    );
  }

  const maxTokens = Math.max(...dailyUsage.map((d) => d.totalTokens));
  const allModels = [...new Set(dailyUsage.flatMap((d) => d.byModel.map((m) => m.model)))];

  return (
    <Card>
      <div className="flex items-end gap-1 h-40">
        {dailyUsage.map((day) => {
          const heightPct = maxTokens > 0 ? (day.totalTokens / maxTokens) * 100 : 0;
          const isHovered = hoveredDay === day.date;

          return (
            <div
              key={day.date}
              className="relative flex-1 flex flex-col justify-end h-full"
              onMouseEnter={() => setHoveredDay(day.date)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div className="flex flex-col justify-end" style={{ height: `${heightPct}%` }}>
                {day.byModel.map((m) => {
                  const segmentPct = day.totalTokens > 0 ? (m.tokens / day.totalTokens) * 100 : 0;
                  return (
                    <div
                      key={m.model}
                      className="w-full min-h-[2px] first:rounded-t"
                      style={{
                        height: `${segmentPct}%`,
                        backgroundColor: getModelColor(m.model as string, allModels.indexOf(m.model as string)),
                        opacity: isHovered ? 1 : 0.7,
                      }}
                    />
                  );
                })}
              </div>
              <p className="text-[10px] text-text-tertiary text-center mt-1 truncate">
                {day.date.slice(5)}
              </p>

              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 whitespace-nowrap rounded-lg border border-border-default bg-surface px-3 py-2 text-xs shadow-lg">
                  <p className="font-medium text-text-primary mb-1">{day.date}</p>
                  <p className="text-text-secondary">
                    {formatTokenCount(day.totalTokens)} tokens &middot; {formatUSD(day.estimatedCost)}
                  </p>
                  {day.byModel.map((m) => (
                    <p key={m.model} className="text-text-tertiary">
                      {m.model}: {formatTokenCount(m.tokens)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border-default">
        {allModels.map((model, i) => (
          <div key={model} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: getModelColor(model, i) }}
            />
            {model}
          </div>
        ))}
      </div>
    </Card>
  );
}
