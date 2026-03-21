export const AI_EVALUATION_STATUSES = ['pending', 'analyzing', 'completed', 'failed'] as const;

export const PROFICIENCY_TIERS = [
  'novice',
  'developing',
  'proficient',
  'advanced',
  'expert',
] as const;

export const EVALUATION_DIMENSIONS = [
  'prompt_quality',
  'task_complexity',
  'iteration_pattern',
  'context_utilization',
  'ai_capability_leverage',
] as const;

export const EVIDENCE_SENTIMENTS = ['positive', 'negative', 'neutral'] as const;

export const DIMENSION_WEIGHTS: Record<(typeof EVALUATION_DIMENSIONS)[number], number> = {
  prompt_quality: 0.25,
  task_complexity: 0.2,
  iteration_pattern: 0.2,
  context_utilization: 0.2,
  ai_capability_leverage: 0.15,
} as const;

export const DIMENSION_LABELS: Record<(typeof EVALUATION_DIMENSIONS)[number], string> = {
  prompt_quality: 'Prompt Quality',
  task_complexity: 'Task Complexity',
  iteration_pattern: 'Iteration Pattern',
  context_utilization: 'Context Utilization',
  ai_capability_leverage: 'AI Capability Leverage',
} as const;

export const PROFICIENCY_TIER_RANGES = {
  novice: { min: 0, max: 25 },
  developing: { min: 26, max: 50 },
  proficient: { min: 51, max: 70 },
  advanced: { min: 71, max: 85 },
  expert: { min: 86, max: 100 },
} as const;

export const EVALUATION_COOLDOWN_HOURS = 24;
export const MIN_MESSAGES_FOR_EVALUATION = 5;
export const MAX_SESSIONS_LIMIT = 100;
export const DEFAULT_MAX_SESSIONS = 50;
export const DEFAULT_DATE_RANGE_DAYS = 30;
export const MAX_PROMPT_EXCERPT_LENGTH = 200;
export const MAX_PROMPT_CHAR_LENGTH = 2000;
export const MAX_TOTAL_CHARS = 80_000;
export const MAX_SAMPLED_MESSAGES = 200;
