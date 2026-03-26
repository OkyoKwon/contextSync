import type { EvaluationPerspective } from '@context-sync/shared';
import { PERSPECTIVE_TIER_LABELS } from '@context-sync/shared';
import { Badge } from '../ui/Badge';
import type { ComponentPropsWithoutRef } from 'react';

type BadgeVariant = ComponentPropsWithoutRef<typeof Badge>['variant'];

const claudeTierVariants: Record<string, BadgeVariant> = {
  novice: 'default',
  developing: 'warning',
  proficient: 'info',
  advanced: 'success',
  expert: 'success',
};

const chatgptTierVariants: Record<string, BadgeVariant> = {
  beginner: 'default',
  intermediate: 'warning',
  advanced: 'info',
  expert: 'success',
};

const geminiTierVariants: Record<string, BadgeVariant> = {
  awareness: 'default',
  user: 'warning',
  advanced: 'info',
  strategist: 'success',
  innovator: 'success',
};

const perspectiveTierVariants: Record<string, Record<string, BadgeVariant>> = {
  claude: claudeTierVariants,
  chatgpt: chatgptTierVariants,
  gemini: geminiTierVariants,
};

export function ProficiencyBadge({
  tier,
  perspective = 'claude',
}: {
  tier: string | null;
  perspective?: EvaluationPerspective;
}) {
  if (!tier) return null;
  const variants = perspectiveTierVariants[perspective] ?? claudeTierVariants;
  const labels = PERSPECTIVE_TIER_LABELS[perspective];
  return <Badge variant={variants[tier] ?? 'default'}>{labels[tier] ?? tier}</Badge>;
}
