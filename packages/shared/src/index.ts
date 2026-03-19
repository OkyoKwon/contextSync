// Types
export type { ApiResponse, PaginationMeta, PaginationQuery } from './types/api.js';
export type { User, UserRole, NotificationSettings } from './types/user.js';
export type {
  Team,
  TeamSettings,
  TeamMember,
  CreateTeamInput,
  UpdateTeamInput,
  AddMemberInput,
} from './types/team.js';
export type { Project, CreateProjectInput, UpdateProjectInput } from './types/project.js';
export type {
  Session,
  SessionSource,
  SessionStatus,
  Message,
  MessageRole,
  MessageContentType,
  SessionWithMessages,
  SessionImportResult,
  SessionFilterQuery,
  TimelineEntry,
  DashboardStats,
} from './types/session.js';
export type { LocalSessionInfo, LocalProjectGroup, SyncSessionResult, SyncSingleResult } from './types/sync.js';
export type {
  Conflict,
  ConflictType,
  ConflictSeverity,
  ConflictStatus,
  ConflictFilterQuery,
  UpdateConflictInput,
  DetectedConflict,
} from './types/conflict.js';

// Constants
export { USER_ROLES } from './constants/roles.js';
export { SESSION_SOURCES, SESSION_STATUSES, MESSAGE_ROLES, MESSAGE_CONTENT_TYPES } from './constants/session-status.js';
export {
  CONFLICT_TYPES,
  CONFLICT_SEVERITIES,
  CONFLICT_STATUSES,
  SEVERITY_THRESHOLDS,
  CONFLICT_DETECTION_WINDOW_DAYS,
} from './constants/conflict-severity.js';

// Validators
export { validateSessionImport } from './validators/session.validator.js';
export type { SessionImportData } from './validators/session.validator.js';
export { validateProjectName, validateRepoUrl } from './validators/project.validator.js';
