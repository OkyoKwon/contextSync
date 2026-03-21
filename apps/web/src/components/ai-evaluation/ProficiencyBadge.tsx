import type { ProficiencyTier } from '@context-sync/shared';
import { Badge } from '../ui/Badge';
import type { ComponentPropsWithoutRef } from 'react';

type BadgeVariant = ComponentPropsWithoutRef<typeof Badge>['variant'];

const tierVariants: Record<string, BadgeVariant> = {
  novice: 'default',
  developing: 'warning',
  proficient: 'info',
  advanced: 'success',
  expert: 'success',
};

const tierLabels: Record<string, string> = {
  novice: 'Novice',
  developing: 'Developing',
  proficient: 'Proficient',
  advanced: 'Advanced',
  expert: 'Expert',
};

export function ProficiencyBadge({ tier }: { tier: ProficiencyTier | null }) {
  if (!tier) return null;
  return <Badge variant={tierVariants[tier] ?? 'default'}>{tierLabels[tier] ?? tier}</Badge>;
}
