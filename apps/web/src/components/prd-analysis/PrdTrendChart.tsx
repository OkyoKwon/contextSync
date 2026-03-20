import { useState } from 'react';
import type { PrdAnalysisHistoryEntry } from '@context-sync/shared';
import {
  computeChartPoints,
  buildSmoothPath,
  buildAreaPath,
  computeDeltas,
  formatChartDate,
} from '../../lib/prd-chart-utils';

interface PrdTrendChartProps {
  readonly entries: readonly PrdAnalysisHistoryEntry[];
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 28, left: 44 } as const;
const INNER_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

export function PrdTrendChart({ entries }: PrdTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const points = computeChartPoints(entries, {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    padding: PADDING,
  });

  if (points.length < 2) return null;

  const deltas = computeDeltas(entries);
  const smoothPath = buildSmoothPath(points);
  const areaPath = buildAreaPath(points, PADDING.top + INNER_HEIGHT);

  const dateLabelInterval = points.length > 8 ? 3 : points.length > 4 ? 2 : 1;

  return (
    <div className="flex flex-col">
      <h4 className="mb-2 text-xs font-medium text-text-tertiary">Achievement Rate Trend</h4>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Dashed grid lines */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = PADDING.top + INNER_HEIGHT - (v / 100) * INNER_HEIGHT;
          return (
            <g key={v}>
              <line
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-border-default"
                strokeWidth={0.5}
                strokeDasharray="4 4"
              />
              <text
                x={PADDING.left - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-text-tertiary text-[9px]"
              >
                {v}%
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Smooth line */}
        <path d={smoothPath} fill="none" stroke="#3b82f6" strokeWidth={2} />

        {/* Delta annotations (when ≤5 points) */}
        {points.length <= 5 &&
          deltas.map((delta, i) => {
            if (delta === null || i >= points.length) return null;
            const point = points[i]!;
            const prevPoint = points[i - 1]!;
            const midX = (prevPoint.x + point.x) / 2;
            const midY = Math.min(prevPoint.y, point.y) - 12;
            return (
              <text
                key={i}
                x={midX}
                y={midY}
                textAnchor="middle"
                className={`text-[9px] font-medium ${
                  delta >= 0 ? 'fill-green-400' : 'fill-red-400'
                }`}
              >
                {delta >= 0 ? '+' : ''}
                {delta.toFixed(1)}
              </text>
            );
          })}

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredIndex === i ? 5 : 3}
            fill="#3b82f6"
            className="transition-all duration-150"
          />
        ))}

        {/* Hover hit areas */}
        {points.map((p, i) => (
          <rect
            key={`hit-${i}`}
            x={p.x - 20}
            y={PADDING.top}
            width={40}
            height={INNER_HEIGHT + PADDING.bottom}
            fill="transparent"
            onMouseEnter={() => setHoveredIndex(i)}
          />
        ))}

        {/* Hover guide line + tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <g>
            <line
              x1={points[hoveredIndex]!.x}
              x2={points[hoveredIndex]!.x}
              y1={PADDING.top}
              y2={PADDING.top + INNER_HEIGHT}
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.5}
            />
            <HoverTooltip
              point={points[hoveredIndex]!}
              delta={deltas[hoveredIndex] ?? null}
              chartWidth={CHART_WIDTH}
            />
          </g>
        )}

        {/* Date labels */}
        {points.map((p, i) =>
          i % dateLabelInterval === 0 || i === points.length - 1 ? (
            <text
              key={`date-${i}`}
              x={p.x}
              y={CHART_HEIGHT - 6}
              textAnchor="middle"
              className="fill-text-tertiary text-[8px]"
            >
              {formatChartDate(p.date)}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}

function HoverTooltip({
  point,
  delta,
  chartWidth,
}: {
  readonly point: { readonly x: number; readonly y: number; readonly rate: number; readonly date: string };
  readonly delta: number | null;
  readonly chartWidth: number;
}) {
  const tooltipWidth = 110;
  const tooltipHeight = delta !== null ? 48 : 34;
  const rawX = point.x - tooltipWidth / 2;
  const x = Math.max(4, Math.min(rawX, chartWidth - tooltipWidth - 4));
  const y = point.y - tooltipHeight - 10;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={tooltipWidth}
        height={tooltipHeight}
        rx={6}
        className="fill-surface-overlay"
        stroke="currentColor"
        strokeWidth={0.5}
      />
      <text x={x + 8} y={y + 14} className="fill-text-primary text-[10px] font-medium">
        {point.rate.toFixed(1)}%
      </text>
      <text x={x + tooltipWidth - 8} y={y + 14} textAnchor="end" className="fill-text-tertiary text-[9px]">
        {formatChartDate(point.date)}
      </text>
      {delta !== null && (
        <text
          x={x + 8}
          y={y + 30}
          className={`text-[9px] font-medium ${delta >= 0 ? 'fill-green-400' : 'fill-red-400'}`}
        >
          {delta >= 0 ? '▲' : '▼'} {delta >= 0 ? '+' : ''}
          {delta.toFixed(1)}%
        </text>
      )}
    </g>
  );
}
