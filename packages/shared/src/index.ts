// Types
export type { ApiResponse, PaginationMeta, PaginationQuery } from './types/api.js';
export type { User, UserRole, NotificationSettings } from './types/user.js';
export type { Collaborator, AddCollaboratorInput } from './types/collaborator.js';
export type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectWithTeamInfo,
} from './types/project.js';
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
  MemberActivity,
} from './types/session.js';
export type {
  LocalDirectory,
  LocalSessionInfo,
  LocalProjectGroup,
  LocalSessionDetail,
  LocalSessionMessage,
  SyncSessionResult,
  SyncSingleResult,
  RecalculateTokenResult,
  UnifiedMessage,
  ProjectConversation,
  BrowseDirectoryEntry,
} from './types/sync.js';
export type {
  TokenUsagePeriod,
  TokenUsageStats,
  ModelUsageBreakdown,
  DailyTokenUsage,
  DailyModelUsage,
} from './types/token-usage.js';
export type {
  Conflict,
  ConflictType,
  ConflictSeverity,
  ConflictStatus,
  ConflictFilterQuery,
  UpdateConflictInput,
  DetectedConflict,
} from './types/conflict.js';
export type {
  PrdDocument,
  PrdAnalysis,
  PrdRequirement,
  PrdAnalysisWithRequirements,
  PrdAnalysisHistoryEntry,
  PrdRequirementStatus,
  PrdAnalysisStatus,
} from './types/prd-analysis.js';

export type { ActivityAction, ActivityEntry } from './types/activity.js';
export type { PlanSummary, PlanDetail, PlanProjectAssociation } from './types/plan.js';
export type { Invitation, InvitationStatus, CreateInvitationInput } from './types/invitation.js';
export type {
  AdminStatus,
  DatabaseHealth,
  ConnectionPoolStats,
  SslStatus,
  MigrationInfo,
  MigrationRunResult,
  DatabaseProvider,
  DeploymentMode,
  AdminConfig,
} from './types/admin.js';
export type {
  AiEvaluation,
  AiEvaluationStatus,
  ProficiencyTier,
  EvaluationDimension,
  EvidenceSentiment,
  AiEvaluationDimensionDetail,
  AiEvaluationEvidence,
  AiEvaluationWithDetails,
  AiEvaluationHistoryEntry,
  TeamEvaluationSummaryEntry,
  TriggerEvaluationInput,
} from './types/ai-evaluation.js';

// Constants
export { USER_ROLES } from './constants/roles.js';
export {
  SESSION_SOURCES,
  SESSION_STATUSES,
  MESSAGE_ROLES,
  MESSAGE_CONTENT_TYPES,
} from './constants/session-status.js';
export {
  CONFLICT_TYPES,
  CONFLICT_SEVERITIES,
  CONFLICT_STATUSES,
  SEVERITY_THRESHOLDS,
  CONFLICT_DETECTION_WINDOW_DAYS,
} from './constants/conflict-severity.js';

export { MODEL_PRICING, DEFAULT_PRICE_PER_MILLION } from './constants/model-pricing.js';
export {
  PRD_REQUIREMENT_STATUSES,
  PRD_ANALYSIS_STATUSES,
  SUPPORTED_PRD_EXTENSIONS,
  MAX_PRD_FILE_SIZE,
} from './constants/prd-analysis.js';
export { INVITATION_STATUSES, INVITATION_EXPIRY_DAYS } from './constants/invitation-status.js';
export {
  AI_EVALUATION_STATUSES,
  PROFICIENCY_TIERS,
  EVALUATION_DIMENSIONS,
  EVIDENCE_SENTIMENTS,
  DIMENSION_WEIGHTS,
  DIMENSION_LABELS,
  PROFICIENCY_TIER_RANGES,
  EVALUATION_COOLDOWN_HOURS,
  MIN_MESSAGES_FOR_EVALUATION,
  MAX_SESSIONS_LIMIT,
  DEFAULT_MAX_SESSIONS,
  DEFAULT_DATE_RANGE_DAYS,
} from './constants/ai-evaluation.js';

// Validators
export { validateSessionImport } from './validators/session.validator.js';
export type { SessionImportData } from './validators/session.validator.js';
export { validateProjectName, validateRepoUrl } from './validators/project.validator.js';
