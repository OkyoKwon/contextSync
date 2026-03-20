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
}

export interface UsersTable {
  id: Generated<string>;
  github_id: number;
  email: string;
  name: string;
  avatar_url: string | null;
  role: Generated<string>;
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
