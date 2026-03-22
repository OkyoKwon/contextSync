export const CLAUDE_PLANS = ['free', 'pro', 'max_5x', 'max_20x', 'team', 'enterprise'] as const;

export type ClaudePlan = (typeof CLAUDE_PLANS)[number];

export const CLAUDE_PLAN_LABELS: Record<ClaudePlan, string> = {
  free: 'Free',
  pro: 'Pro',
  max_5x: 'Max 5×',
  max_20x: 'Max 20×',
  team: 'Team',
  enterprise: 'Enterprise',
} as const;
