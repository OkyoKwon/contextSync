import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE prd_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);

  await sql`CREATE INDEX idx_prd_documents_project_id ON prd_documents(project_id)`.execute(db);

  await sql`
    CREATE TABLE prd_analyses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      prd_document_id UUID NOT NULL REFERENCES prd_documents(id) ON DELETE CASCADE,
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      overall_rate NUMERIC(5, 2),
      total_items INTEGER NOT NULL DEFAULT 0,
      achieved_items INTEGER NOT NULL DEFAULT 0,
      partial_items INTEGER NOT NULL DEFAULT 0,
      not_started_items INTEGER NOT NULL DEFAULT 0,
      scanned_files_count INTEGER NOT NULL DEFAULT 0,
      model_used VARCHAR(100) NOT NULL,
      input_tokens_used INTEGER NOT NULL DEFAULT 0,
      output_tokens_used INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `.execute(db);

  await sql`CREATE INDEX idx_prd_analyses_project_id ON prd_analyses(project_id)`.execute(db);
  await sql`CREATE INDEX idx_prd_analyses_prd_document_id ON prd_analyses(prd_document_id)`.execute(db);

  await sql`
    CREATE TABLE prd_requirements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      prd_analysis_id UUID NOT NULL REFERENCES prd_analyses(id) ON DELETE CASCADE,
      requirement_text TEXT NOT NULL,
      category VARCHAR(100),
      status VARCHAR(50) NOT NULL,
      confidence NUMERIC(5, 2) NOT NULL,
      evidence TEXT,
      file_paths TEXT[] NOT NULL DEFAULT '{}',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);

  await sql`CREATE INDEX idx_prd_requirements_analysis_id ON prd_requirements(prd_analysis_id)`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS prd_requirements`.execute(db);
  await sql`DROP TABLE IF EXISTS prd_analyses`.execute(db);
  await sql`DROP TABLE IF EXISTS prd_documents`.execute(db);
}
