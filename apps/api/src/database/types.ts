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
}

export interface SyncedSessionsTable {
  id: Generated<string>;
  project_id: string;
  session_id: string;
  external_session_id: string;
  source_path: string;
  synced_at: Generated<Date>;
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
