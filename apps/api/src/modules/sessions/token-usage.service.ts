import type { Db } from '../../database/client.js';
import type {
  TokenUsagePeriod,
  TokenUsageStats,
  ModelUsageBreakdown,
  DailyTokenUsage,
} from '@context-sync/shared';
import { MODEL_PRICING, DEFAULT_PRICE_PER_MILLION } from '@context-sync/shared';
import { assertProjectAccess } from '../projects/project.service.js';
import * as tokenUsageRepo from './token-usage.repository.js';

function periodToDays(period: TokenUsagePeriod): number {
  const map: Record<TokenUsagePeriod, number> = { '7d': 7, '30d': 30, '90d': 90 };
  return map[period];
}

function normalizeModelName(raw: string): string {
  return raw.replace(/-\d{8}$/, '');
}

function estimateCost(tokens: number, model: string): number {
  const price = MODEL_PRICING[model] ?? DEFAULT_PRICE_PER_MILLION;
  return (tokens / 1_000_000) * price;
}

export async function getTokenUsageStats(
  db: Db,
  projectId: string,
  userId: string,
  period: TokenUsagePeriod,
): Promise<TokenUsageStats> {
  await assertProjectAccess(db, projectId, userId);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodToDays(period));

  const [modelRows, dailyRows, messageCounts] = await Promise.all([
    tokenUsageRepo.getModelBreakdown(db, projectId, startDate, endDate),
    tokenUsageRepo.getDailyUsage(db, projectId, startDate, endDate),
    tokenUsageRepo.getTotalMessageCount(db, projectId, startDate, endDate),
  ]);

  // Aggregate model breakdown with normalized names
  const modelMap = new Map<string, { tokens: number; messages: number }>();
  for (const row of modelRows) {
    const model = normalizeModelName(row.model_used);
    const existing = modelMap.get(model) ?? { tokens: 0, messages: 0 };
    modelMap.set(model, {
      tokens: existing.tokens + Number(row.total_tokens),
      messages: existing.messages + Number(row.message_count),
    });
  }

  const totalTokens = [...modelMap.values()].reduce((sum, v) => sum + v.tokens, 0);

  const modelBreakdown: readonly ModelUsageBreakdown[] = [...modelMap.entries()]
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .map(([model, data]) => ({
      model,
      totalTokens: data.tokens,
      messageCount: data.messages,
      estimatedCost: estimateCost(data.tokens, model),
      percentage: totalTokens > 0 ? Math.round((data.tokens / totalTokens) * 1000) / 10 : 0,
    }));

  // Aggregate daily usage with normalized model names
  const dailyMap = new Map<string, Map<string, number>>();
  for (const row of dailyRows) {
    const model = normalizeModelName(row.model_used);
    const dayMap = dailyMap.get(row.date) ?? new Map<string, number>();
    dayMap.set(model, (dayMap.get(model) ?? 0) + Number(row.total_tokens));
    dailyMap.set(row.date, dayMap);
  }

  const dailyUsage: readonly DailyTokenUsage[] = [...dailyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, models]) => {
      const byModel = [...models.entries()].map(([model, tokens]) => ({ model, tokens }));
      const dayTotal = byModel.reduce((sum, m) => sum + m.tokens, 0);
      return {
        date,
        totalTokens: dayTotal,
        estimatedCost: byModel.reduce((sum, m) => sum + estimateCost(m.tokens, m.model), 0),
        byModel,
      };
    });

  const totalCost = modelBreakdown.reduce((sum, m) => sum + m.estimatedCost, 0);

  return {
    totalTokens,
    totalCost,
    totalMessages: messageCounts.total,
    measuredMessages: messageCounts.measured,
    periodStart: startDate.toISOString(),
    periodEnd: endDate.toISOString(),
    modelBreakdown,
    dailyUsage,
  };
}
