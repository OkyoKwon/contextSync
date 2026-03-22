import type { TokenUsagePeriod } from '@context-sync/shared';
import { MODEL_PRICING, DEFAULT_PRICE_PER_MILLION } from '@context-sync/shared';

export function periodToDays(period: TokenUsagePeriod): number {
  const map: Record<TokenUsagePeriod, number> = { '7d': 7, '30d': 30, '90d': 90 };
  return map[period];
}

export function normalizeModelName(raw: string): string {
  return raw.replace(/-\d{8}$/, '');
}

export function estimateCost(tokens: number, model: string): number {
  const price = MODEL_PRICING[model] ?? DEFAULT_PRICE_PER_MILLION;
  return (tokens / 1_000_000) * price;
}
