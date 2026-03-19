export const CONFLICT_TYPES = ['file', 'design', 'dependency', 'plan'] as const;
export const CONFLICT_SEVERITIES = ['info', 'warning', 'critical'] as const;
export const CONFLICT_STATUSES = ['detected', 'reviewing', 'resolved', 'dismissed'] as const;

export const SEVERITY_THRESHOLDS = {
  info: { minOverlap: 1, maxOverlap: 2 },
  warning: { minOverlap: 3, maxOverlap: 5 },
  critical: { minOverlap: 6, maxOverlap: Infinity },
} as const;

export const CONFLICT_DETECTION_WINDOW_DAYS = 7;
