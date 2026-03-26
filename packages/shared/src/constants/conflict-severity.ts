export const CONFLICT_TYPES = ['file', 'design', 'dependency', 'plan'] as const;
export const CONFLICT_SEVERITIES = ['info', 'warning', 'critical'] as const;
export const CONFLICT_STATUSES = ['detected', 'reviewing', 'resolved', 'dismissed'] as const;

export const SEVERITY_THRESHOLDS = {
  info: { minOverlap: 1, maxOverlap: 3 },
  warning: { minOverlap: 4, maxOverlap: 7 },
  critical: { minOverlap: 8, maxOverlap: Infinity },
} as const;

export const CONFLICT_DETECTION_WINDOW_DAYS = 3;
