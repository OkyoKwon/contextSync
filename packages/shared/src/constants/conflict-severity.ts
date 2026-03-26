export const CONFLICT_TYPES = ['file', 'design', 'dependency', 'plan'] as const;
export const CONFLICT_SEVERITIES = ['info', 'warning', 'critical'] as const;
export const CONFLICT_STATUSES = ['detected', 'reviewing', 'resolved', 'dismissed'] as const;

export const SEVERITY_THRESHOLDS = {
  info: { minOverlap: 1, maxOverlap: 3 },
  warning: { minOverlap: 4, maxOverlap: 7 },
  critical: { minOverlap: 8, maxOverlap: Infinity },
} as const;

export const CONFLICT_DETECTION_WINDOW_DAYS = 3;

export const AI_VERDICTS = [
  'real_conflict',
  'likely_conflict',
  'low_risk',
  'false_positive',
] as const;
export const AI_OVERLAP_TYPES = [
  'same_function',
  'same_feature',
  'shared_utility',
  'independent',
] as const;
export const AI_RECOMMENDATIONS = [
  'coordinate',
  'review_together',
  'no_action',
  'merge_carefully',
] as const;
export const AI_VERIFY_COOLDOWN_MINUTES = 10;
