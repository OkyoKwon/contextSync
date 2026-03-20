/** Average estimated price per 1M tokens (USD), blending input/output rates. */
export const MODEL_PRICING: Readonly<Record<string, number>> = {
  'claude-opus-4-6': 37.5,
  'claude-opus-4-5': 37.5,
  'claude-opus-4': 37.5,
  'claude-sonnet-4-6': 9.0,
  'claude-sonnet-4-5': 9.0,
  'claude-sonnet-4': 9.0,
  'claude-haiku-4-5': 2.0,
  'claude-haiku-4': 2.0,
  'claude-3-5-sonnet': 9.0,
  'claude-3-5-haiku': 2.0,
  'claude-3-opus': 37.5,
  'claude-3-sonnet': 9.0,
  'claude-3-haiku': 0.65,
};

export const DEFAULT_PRICE_PER_MILLION = 9.0;
