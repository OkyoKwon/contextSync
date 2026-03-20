/** Average estimated price per 1M tokens (USD), blending input/output rates. */
export const MODEL_PRICING: Readonly<Record<string, number>> = {
  'claude-opus-4': 37.50,
  'claude-sonnet-4': 9.00,
  'claude-haiku-4': 2.00,
  'claude-3-5-sonnet': 9.00,
  'claude-3-5-haiku': 2.00,
  'claude-3-opus': 37.50,
  'claude-3-sonnet': 9.00,
  'claude-3-haiku': 0.65,
};

export const DEFAULT_PRICE_PER_MILLION = 9.00;
