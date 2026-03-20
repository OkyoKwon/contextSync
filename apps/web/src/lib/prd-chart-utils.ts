import type { PrdAnalysisHistoryEntry } from '@context-sync/shared';

export interface ChartPoint {
  readonly x: number;
  readonly y: number;
  readonly rate: number;
  readonly date: string;
}

interface ChartDimensions {
  readonly width: number;
  readonly height: number;
  readonly padding: {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
  };
}

export function computeChartPoints(
  entries: readonly PrdAnalysisHistoryEntry[],
  dimensions: ChartDimensions,
): readonly ChartPoint[] {
  const completed = entries
    .filter((e) => e.status === 'completed' && e.overallRate !== null)
    .slice().reverse();

  if (completed.length === 0) return [];

  const { width, height, padding } = dimensions;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxRate = 100;

  return completed.map((entry, i) => {
    const x =
      completed.length === 1
        ? padding.left + innerWidth / 2
        : padding.left + (i / (completed.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - ((entry.overallRate ?? 0) / maxRate) * innerHeight;
    return { x, y, rate: entry.overallRate ?? 0, date: entry.createdAt };
  });
}

export function buildSmoothPath(points: readonly ChartPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;

  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const cpX = (prev.x + curr.x) / 2;
    path += ` Q ${cpX} ${prev.y}, ${(cpX + curr.x) / 2} ${(prev.y + curr.y) / 2}`;
    if (i === points.length - 1) {
      path += ` Q ${cpX + (curr.x - cpX)} ${curr.y}, ${curr.x} ${curr.y}`;
    }
  }
  return path;
}

export function buildAreaPath(points: readonly ChartPoint[], baseY: number): string {
  if (points.length < 2) return '';
  const smoothLine = buildSmoothPath(points);
  const lastPoint = points[points.length - 1]!;
  const firstPoint = points[0]!;
  return `${smoothLine} L ${lastPoint.x} ${baseY} L ${firstPoint.x} ${baseY} Z`;
}

export function computeDeltas(entries: readonly PrdAnalysisHistoryEntry[]): readonly (number | null)[] {
  const completed = entries
    .filter((e) => e.status === 'completed' && e.overallRate !== null)
    .slice().reverse();

  return completed.map((entry, i) => {
    if (i === 0) return null;
    const prev = completed[i - 1]!;
    return (entry.overallRate ?? 0) - (prev.overallRate ?? 0);
  });
}

export function formatChartDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
