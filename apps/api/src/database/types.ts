import type { Generated, ColumnType } from 'kysely';

export interface Database {
  users: UsersTable;
  projects: ProjectsTable;
  project_collaborators: ProjectCollaboratorsTable;
  sessions: SessionsTable;
  messages: MessagesTable;
  conflicts: ConflictsTable;
  prompt_templates: PromptTemplatesTable;
  synced_sessions: SyncedSessionsTable;
  prd_documents: PrdDocumentsTable;
  prd_analyses: PrdAnalysesTable;
  prd_requirements: PrdRequirementsTable;
  activity_log: ActivityLogTable;
  ai_evaluations: AiEvaluationsTable;
  ai_evaluation_dimensions: AiEvaluationDimensionsTable;
  ai_evaluation_evidence: AiEvaluationEvidenceTable;
  ai_evaluation_learning_guides: AiEvaluationLearningGuidesTable;
  ai_evaluation_learning_steps: AiEvaluationLearningStepsTable;
  ai_evaluation_learning_resources: AiEvaluationLearningResourcesTable;
}

export interface UsersTable {
  id: Generated<string>;
  github_id: number | null;
  email: string;
  name: string;
  avatar_url: string | null;
  role: Generated<string>;
  is_auto: Generated<boolean>;
  claude_plan: Generated<string>;
  plan_detection_source: string | null;
  anthropic_api_key: string | null;
  supabase_access_token: string | null;
  notification_settings: Generated<string>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface ProjectsTable {
  id: Generated<string>;
  owner_id: string;
  name: string;
  description: string | null;
  repo_url: string | null;
  local_directory: string | null;
  join_code: ColumnType<string | null>;
  database_mode: Generated<string>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface ProjectCollaboratorsTable {
  id: Generated<string>;
  project_id: string;
  user_id: string;
  role: string;
  local_directory: string | null;
  added_at: Generated<Date>;
}

export interface SessionsTable {
  id: Generated<string>;
  project_id: string;
  user_id: string;
  title: string;
  source: Generated<string>;
  status: Generated<string>;
  file_paths: Generated<string[]>;
  module_names: Generated<string[]>;
  branch: string | null;
  tags: Generated<string[]>;
  metadata: Generated<string>;
  search_vector: ColumnType<string, never, never>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface MessagesTable {
  id: Generated<string>;
  session_id: string;
  role: string;
  content: string;
  content_type: string;
  tokens_used: number | null;
  model_used: string | null;
  sort_order: Generated<number>;
  search_vector: ColumnType<string, never, never>;
  created_at: Generated<Date>;
}

export interface ConflictsTable {
  id: Generated<string>;
  project_id: string;
  session_a_id: string;
  session_b_id: string;
  conflict_type: string;
  severity: string;
  status: Generated<string>;
  description: string;
  overlapping_paths: Generated<string[]>;
  diff_data: Generated<string>;
  resolved_by: string | null;
  created_at: Generated<Date>;
  resolved_at: Date | null;
  reviewer_id: string | null;
  review_notes: string | null;
  assigned_at: Date | null;
  ai_verdict: string | null;
  ai_confidence: number | null;
  ai_overlap_type: string | null;
  ai_summary: string | null;
  ai_risk_areas: string[] | null;
  ai_recommendation: string | null;
  ai_recommendation_detail: string | null;
  ai_analyzed_at: Date | null;
  ai_model_used: string | null;
  ai_input_tokens: number | null;
  ai_output_tokens: number | null;
}

export interface SyncedSessionsTable {
  id: Generated<string>;
  project_id: string;
  session_id: string;
  external_session_id: string;
  source_path: string;
  synced_at: Generated<Date>;
}

export interface PrdDocumentsTable {
  id: Generated<string>;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  file_name: string;
  created_at: Generated<Date>;
}

export interface PrdAnalysesTable {
  id: Generated<string>;
  prd_document_id: string;
  project_id: string;
  status: Generated<string>;
  overall_rate: number | null;
  total_items: Generated<number>;
  achieved_items: Generated<number>;
  partial_items: Generated<number>;
  not_started_items: Generated<number>;
  scanned_files_count: Generated<number>;
  model_used: string;
  input_tokens_used: Generated<number>;
  output_tokens_used: Generated<number>;
  error_message: string | null;
  created_at: Generated<Date>;
  completed_at: Date | null;
}

export interface PrdRequirementsTable {
  id: Generated<string>;
  prd_analysis_id: string;
  requirement_text: string;
  category: string | null;
  status: string;
  confidence: number;
  evidence: string | null;
  file_paths: Generated<string[]>;
  sort_order: Generated<number>;
  created_at: Generated<Date>;
}

export interface ActivityLogTable {
  id: Generated<string>;
  project_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Generated<string>;
  created_at: Generated<Date>;
}

export interface AiEvaluationsTable {
  id: Generated<string>;
  project_id: string;
  target_user_id: string;
  triggered_by_user_id: string;
  status: Generated<string>;
  overall_score: number | null;
  prompt_quality_score: number | null;
  task_complexity_score: number | null;
  iteration_pattern_score: number | null;
  context_utilization_score: number | null;
  ai_capability_leverage_score: number | null;
  proficiency_tier: string | null;
  sessions_analyzed: Generated<number>;
  messages_analyzed: Generated<number>;
  date_range_start: Date;
  date_range_end: Date;
  model_used: string;
  input_tokens_used: Generated<number>;
  output_tokens_used: Generated<number>;
  error_message: string | null;
  improvement_summary: string | null;
  improvement_summary_ko: string | null;
  perspective: Generated<string>;
  evaluation_group_id: string | null;
  created_at: Generated<Date>;
  completed_at: Date | null;
}

export interface AiEvaluationDimensionsTable {
  id: Generated<string>;
  evaluation_id: string;
  dimension: string;
  score: number;
  confidence: number;
  summary: string;
  summary_ko: string | null;
  strengths: Generated<string[]>;
  strengths_ko: string[] | null;
  weaknesses: Generated<string[]>;
  weaknesses_ko: string[] | null;
  suggestions: Generated<string[]>;
  suggestions_ko: string[] | null;
  sort_order: Generated<number>;
}

export interface AiEvaluationEvidenceTable {
  id: Generated<string>;
  dimension_id: string;
  message_id: string | null;
  session_id: string | null;
  excerpt: string;
  sentiment: Generated<string>;
  annotation: string;
  annotation_ko: string | null;
  sort_order: Generated<number>;
}

export interface AiEvaluationLearningGuidesTable {
  id: Generated<string>;
  evaluation_group_id: string;
  target_user_id: string;
  status: Generated<string>;
  current_tier_summary: string | null;
  current_tier_summary_ko: string | null;
  next_tier_goal: string | null;
  next_tier_goal_ko: string | null;
  priority_areas: Generated<string[]>;
  model_used: string;
  input_tokens_used: Generated<number>;
  output_tokens_used: Generated<number>;
  error_message: string | null;
  created_at: Generated<Date>;
  completed_at: Date | null;
}

export interface AiEvaluationLearningStepsTable {
  id: Generated<string>;
  learning_guide_id: string;
  step_number: number;
  title: string;
  title_ko: string | null;
  objective: string;
  objective_ko: string | null;
  target_dimensions: Generated<string[]>;
  key_actions: Generated<string[]>;
  key_actions_ko: string[] | null;
  practice_prompt: string | null;
  practice_prompt_ko: string | null;
  sort_order: Generated<number>;
}

export interface AiEvaluationLearningResourcesTable {
  id: Generated<string>;
  learning_step_id: string;
  title: string;
  title_ko: string | null;
  url: string;
  type: string;
  level: string;
  description: string;
  description_ko: string | null;
  estimated_minutes: number | null;
  sort_order: Generated<number>;
}

export interface PromptTemplatesTable {
  id: Generated<string>;
  project_id: string | null;
  author_id: string;
  title: string;
  description: string | null;
  content: string;
  variables: Generated<string>;
  category: string | null;
  tags: Generated<string[]>;
  usage_count: Generated<number>;
  version: Generated<number>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}
