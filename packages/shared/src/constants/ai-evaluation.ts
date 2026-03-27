// === Evaluation Statuses ===

export const AI_EVALUATION_STATUSES = ['pending', 'analyzing', 'completed', 'failed'] as const;

export const EVIDENCE_SENTIMENTS = ['positive', 'negative', 'neutral'] as const;

// === Perspectives ===

export const EVALUATION_PERSPECTIVES = ['claude', 'chatgpt', 'gemini', '4d_framework'] as const;

// === Claude Dimensions (existing) ===

export const EVALUATION_DIMENSIONS = [
  'prompt_quality',
  'task_complexity',
  'iteration_pattern',
  'context_utilization',
  'ai_capability_leverage',
] as const;

export const CLAUDE_DIMENSIONS = EVALUATION_DIMENSIONS;

// === ChatGPT Dimensions ===

export const CHATGPT_DIMENSIONS = [
  'problem_framing',
  'prompt_engineering',
  'output_validation',
  'efficiency',
  'tooling',
  'adaptability',
  'collaboration',
] as const;

// === Gemini Dimensions ===

export const GEMINI_DIMENSIONS = [
  'technical_proficiency',
  'critical_thinking',
  'integration_problem_solving',
  'ethics_security',
] as const;

// === 4D Framework Dimensions ===

export const FOUR_D_DIMENSIONS = ['delegation', 'description', 'discernment', 'diligence'] as const;

export const PERSPECTIVE_DIMENSIONS = {
  claude: CLAUDE_DIMENSIONS,
  chatgpt: CHATGPT_DIMENSIONS,
  gemini: GEMINI_DIMENSIONS,
  '4d_framework': FOUR_D_DIMENSIONS,
} as const;

// === Proficiency Tiers ===

export const PROFICIENCY_TIERS = [
  'novice',
  'developing',
  'proficient',
  'advanced',
  'expert',
] as const;

// === Dimension Weights ===

export const DIMENSION_WEIGHTS: Record<(typeof EVALUATION_DIMENSIONS)[number], number> = {
  prompt_quality: 0.25,
  task_complexity: 0.2,
  iteration_pattern: 0.2,
  context_utilization: 0.2,
  ai_capability_leverage: 0.15,
} as const;

export const CLAUDE_DIMENSION_WEIGHTS = DIMENSION_WEIGHTS;

export const CHATGPT_DIMENSION_WEIGHTS: Record<(typeof CHATGPT_DIMENSIONS)[number], number> = {
  problem_framing: 0.15,
  prompt_engineering: 0.2,
  output_validation: 0.2,
  efficiency: 0.15,
  tooling: 0.1,
  adaptability: 0.1,
  collaboration: 0.1,
} as const;

export const GEMINI_DIMENSION_WEIGHTS: Record<(typeof GEMINI_DIMENSIONS)[number], number> = {
  technical_proficiency: 0.3,
  critical_thinking: 0.25,
  integration_problem_solving: 0.25,
  ethics_security: 0.2,
} as const;

export const FOUR_D_DIMENSION_WEIGHTS: Record<(typeof FOUR_D_DIMENSIONS)[number], number> = {
  delegation: 0.25,
  description: 0.25,
  discernment: 0.25,
  diligence: 0.25,
} as const;

export const PERSPECTIVE_WEIGHTS = {
  claude: CLAUDE_DIMENSION_WEIGHTS,
  chatgpt: CHATGPT_DIMENSION_WEIGHTS,
  gemini: GEMINI_DIMENSION_WEIGHTS,
  '4d_framework': FOUR_D_DIMENSION_WEIGHTS,
} as const;

// === Tier Ranges ===

export const PROFICIENCY_TIER_RANGES = {
  novice: { min: 0, max: 25 },
  developing: { min: 26, max: 50 },
  proficient: { min: 51, max: 70 },
  advanced: { min: 71, max: 85 },
  expert: { min: 86, max: 100 },
} as const;

export const CLAUDE_TIER_RANGES = PROFICIENCY_TIER_RANGES;

export const CHATGPT_TIER_RANGES = {
  beginner: { min: 0, max: 25 },
  intermediate: { min: 26, max: 50 },
  advanced: { min: 51, max: 75 },
  expert: { min: 76, max: 100 },
} as const;

export const GEMINI_TIER_RANGES = {
  awareness: { min: 0, max: 20 },
  user: { min: 21, max: 40 },
  advanced: { min: 41, max: 60 },
  strategist: { min: 61, max: 80 },
  innovator: { min: 81, max: 100 },
} as const;

export const FOUR_D_TIER_RANGES = {
  foundational: { min: 0, max: 25 },
  developing: { min: 26, max: 50 },
  proficient: { min: 51, max: 70 },
  advanced: { min: 71, max: 85 },
  fluent: { min: 86, max: 100 },
} as const;

export const PERSPECTIVE_TIER_RANGES = {
  claude: CLAUDE_TIER_RANGES,
  chatgpt: CHATGPT_TIER_RANGES,
  gemini: GEMINI_TIER_RANGES,
  '4d_framework': FOUR_D_TIER_RANGES,
} as const;

// === Dimension Labels ===

export const DIMENSION_LABELS: Record<string, string> = {
  // Claude
  prompt_quality: 'Prompt Quality',
  task_complexity: 'Task Complexity',
  iteration_pattern: 'Iteration Pattern',
  context_utilization: 'Context Utilization',
  ai_capability_leverage: 'AI Capability Leverage',
  // ChatGPT
  problem_framing: 'Problem Framing',
  prompt_engineering: 'Prompt Engineering',
  output_validation: 'Output Validation',
  efficiency: 'Efficiency',
  tooling: 'Tooling',
  adaptability: 'Adaptability',
  collaboration: 'Collaboration',
  // Gemini
  technical_proficiency: 'Technical Proficiency',
  critical_thinking: 'Critical Thinking',
  integration_problem_solving: 'Integration & Problem Solving',
  ethics_security: 'Ethics & Security',
  // 4D Framework
  delegation: 'Delegation',
  description: 'Description',
  discernment: 'Discernment',
  diligence: 'Diligence',
} as const;

export const CLAUDE_DIMENSION_LABELS: Record<string, string> = {
  prompt_quality: 'Prompt Quality',
  task_complexity: 'Task Complexity',
  iteration_pattern: 'Iteration Pattern',
  context_utilization: 'Context Utilization',
  ai_capability_leverage: 'AI Capability Leverage',
} as const;

export const CHATGPT_DIMENSION_LABELS: Record<string, string> = {
  problem_framing: 'Problem Framing',
  prompt_engineering: 'Prompt Engineering',
  output_validation: 'Output Validation',
  efficiency: 'Efficiency',
  tooling: 'Tooling',
  adaptability: 'Adaptability',
  collaboration: 'Collaboration',
} as const;

export const GEMINI_DIMENSION_LABELS: Record<string, string> = {
  technical_proficiency: 'Technical Proficiency',
  critical_thinking: 'Critical Thinking',
  integration_problem_solving: 'Integration & Problem Solving',
  ethics_security: 'Ethics & Security',
} as const;

export const FOUR_D_DIMENSION_LABELS: Record<string, string> = {
  delegation: 'Delegation',
  description: 'Description',
  discernment: 'Discernment',
  diligence: 'Diligence',
} as const;

export const PERSPECTIVE_DIMENSION_LABELS = {
  claude: CLAUDE_DIMENSION_LABELS,
  chatgpt: CHATGPT_DIMENSION_LABELS,
  gemini: GEMINI_DIMENSION_LABELS,
  '4d_framework': FOUR_D_DIMENSION_LABELS,
} as const;

// === Tier Labels ===

export const CLAUDE_TIER_LABELS: Record<string, string> = {
  novice: 'Novice',
  developing: 'Developing',
  proficient: 'Proficient',
  advanced: 'Advanced',
  expert: 'Expert',
} as const;

export const CHATGPT_TIER_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
} as const;

export const GEMINI_TIER_LABELS: Record<string, string> = {
  awareness: 'Awareness',
  user: 'User',
  advanced: 'Advanced',
  strategist: 'Strategist',
  innovator: 'Innovator',
} as const;

export const FOUR_D_TIER_LABELS: Record<string, string> = {
  foundational: 'Foundational',
  developing: 'Developing',
  proficient: 'Proficient',
  advanced: 'Advanced',
  fluent: 'Fluent',
} as const;

export const PERSPECTIVE_TIER_LABELS = {
  claude: CLAUDE_TIER_LABELS,
  chatgpt: CHATGPT_TIER_LABELS,
  gemini: GEMINI_TIER_LABELS,
  '4d_framework': FOUR_D_TIER_LABELS,
} as const;

// === Perspective Labels ===

export const PERSPECTIVE_LABELS: Record<string, string> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  '4d_framework': '4D Framework',
} as const;

// === Constraints ===

export const EVALUATION_COOLDOWN_HOURS = 24;
export const MIN_MESSAGES_FOR_EVALUATION = 5;
export const MAX_SESSIONS_LIMIT = 100;
export const DEFAULT_MAX_SESSIONS = 50;
export const DEFAULT_DATE_RANGE_DAYS = 30;
export const MAX_PROMPT_EXCERPT_LENGTH = 200;
export const MAX_PROMPT_CHAR_LENGTH = 2000;
export const MAX_TOTAL_CHARS = 80_000;
export const MAX_SAMPLED_MESSAGES = 200;
