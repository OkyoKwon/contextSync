// Types
export type { ApiResponse, PaginationMeta, PaginationQuery } from './types/api.js';
export type { User, UserRole, NotificationSettings } from './types/user.js';
export type {
  Collaborator,
  AddCollaboratorInput,
  CollaboratorDataSummary,
  DeletedDataSummary,
} from './types/collaborator.js';
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
  AiVerdict,
  AiOverlapType,
  AiRecommendation,
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
export type {
  DbProvider,
  DbConfigStatus,
  MigrationJobStatus,
  MigrationDirection,
  DbConfig,
  ConnectionTestResult,
  MigrationPreview,
  MigrationProgress,
  SaveDbConfigInput,
  TestConnectionInput,
} from './types/db-config.js';
export type {
  SupabaseProject,
  SupabaseOrganization,
  CreateSupabaseProjectInput,
  AutoSetupExistingInput,
  AutoSetupNewInput,
} from './types/supabase-onboarding.js';
export type { PlanSummary, PlanDetail, PlanProjectAssociation } from './types/plan.js';
export type {
  AdminStatus,
  DatabaseHealth,
  ConnectionPoolStats,
  SslStatus,
  MigrationInfo,
  MigrationRunResult,
  AdminConfig,
} from './types/admin.js';
export type {
  AiEvaluation,
  AiEvaluationStatus,
  ProficiencyTier,
  EvaluationPerspective,
  EvaluationDimension,
  ChatGPTDimension,
  GeminiDimension,
  AnyDimension,
  EvidenceSentiment,
  AiEvaluationDimensionDetail,
  AiEvaluationEvidence,
  AiEvaluationWithDetails,
  AiEvaluationHistoryEntry,
  EvaluationGroupResult,
  EvaluationGroupHistoryEntry,
  TeamEvaluationSummaryEntry,
  TriggerEvaluationInput,
  TriggerEvaluationGroupResult,
} from './types/ai-evaluation.js';
export type { QuotaStatus, PlanDetectionSource } from './types/rate-limit.js';

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
  AI_VERDICTS,
  AI_OVERLAP_TYPES,
  AI_RECOMMENDATIONS,
  AI_VERIFY_COOLDOWN_MINUTES,
} from './constants/conflict-severity.js';

export { MODEL_PRICING, DEFAULT_PRICE_PER_MILLION } from './constants/model-pricing.js';
export { CLAUDE_PLANS, CLAUDE_PLAN_LABELS } from './constants/claude-plan.js';
export type { ClaudePlan } from './constants/claude-plan.js';
export {
  PRD_REQUIREMENT_STATUSES,
  PRD_ANALYSIS_STATUSES,
  SUPPORTED_PRD_EXTENSIONS,
  MAX_PRD_FILE_SIZE,
} from './constants/prd-analysis.js';
export {
  ANTHROPIC_MODELS,
  RECOMMENDED_MODEL,
  ANTHROPIC_MODEL_LABELS,
} from './constants/anthropic-models.js';
export type { AnthropicModel } from './constants/anthropic-models.js';

export {
  AI_EVALUATION_STATUSES,
  PROFICIENCY_TIERS,
  EVALUATION_PERSPECTIVES,
  EVALUATION_DIMENSIONS,
  CLAUDE_DIMENSIONS,
  CHATGPT_DIMENSIONS,
  GEMINI_DIMENSIONS,
  PERSPECTIVE_DIMENSIONS,
  EVIDENCE_SENTIMENTS,
  DIMENSION_WEIGHTS,
  CLAUDE_DIMENSION_WEIGHTS,
  CHATGPT_DIMENSION_WEIGHTS,
  GEMINI_DIMENSION_WEIGHTS,
  PERSPECTIVE_WEIGHTS,
  DIMENSION_LABELS,
  CLAUDE_DIMENSION_LABELS,
  CHATGPT_DIMENSION_LABELS,
  GEMINI_DIMENSION_LABELS,
  PERSPECTIVE_DIMENSION_LABELS,
  PROFICIENCY_TIER_RANGES,
  CLAUDE_TIER_RANGES,
  CHATGPT_TIER_RANGES,
  GEMINI_TIER_RANGES,
  PERSPECTIVE_TIER_RANGES,
  CLAUDE_TIER_LABELS,
  CHATGPT_TIER_LABELS,
  GEMINI_TIER_LABELS,
  PERSPECTIVE_TIER_LABELS,
  PERSPECTIVE_LABELS,
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
