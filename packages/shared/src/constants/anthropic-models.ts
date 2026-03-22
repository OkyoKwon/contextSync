export const ANTHROPIC_MODELS = [
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'claude-sonnet-4-5-20250514',
  'claude-sonnet-4-20250514',
  'claude-haiku-4-5-20251001',
] as const;

export type AnthropicModel = (typeof ANTHROPIC_MODELS)[number];

export const RECOMMENDED_MODEL = 'claude-sonnet-4-20250514' as const;

export const ANTHROPIC_MODEL_LABELS: Readonly<Record<AnthropicModel, string>> = {
  'claude-opus-4-6': 'Claude Opus 4.6',
  'claude-sonnet-4-6': 'Claude Sonnet 4.6',
  'claude-sonnet-4-5-20250514': 'Claude Sonnet 4.5',
  'claude-sonnet-4-20250514': 'Claude Sonnet 4',
  'claude-haiku-4-5-20251001': 'Claude Haiku 4.5',
};
