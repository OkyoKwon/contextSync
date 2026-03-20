export type TokenUsagePeriod = '7d' | '30d' | '90d';

export interface ModelUsageBreakdown {
  readonly model: string;
  readonly totalTokens: number;
  readonly messageCount: number;
  readonly estimatedCost: number;
  readonly percentage: number;
}

export interface DailyModelUsage {
  readonly model: string;
  readonly tokens: number;
}

export interface DailyTokenUsage {
  readonly date: string;
  readonly totalTokens: number;
  readonly estimatedCost: number;
  readonly byModel: readonly DailyModelUsage[];
}

export interface TokenUsageStats {
  readonly totalTokens: number;
  readonly totalCost: number;
  readonly totalMessages: number;
  readonly measuredMessages: number;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly modelBreakdown: readonly ModelUsageBreakdown[];
  readonly dailyUsage: readonly DailyTokenUsage[];
}
