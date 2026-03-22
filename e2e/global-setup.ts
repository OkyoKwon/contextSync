import pg from 'pg';

const TEST_DB_URL = 'postgresql://postgres:postgres@localhost:5432/contextsync_test';

const APP_TABLES = [
  'data_migration_jobs',
  'project_db_configs',
  'ai_evaluation_evidence',
  'ai_evaluation_dimensions',
  'ai_evaluations',
  'activity_log',
  'prd_requirements',
  'prd_analyses',
  'prd_documents',
  'synced_sessions',
  'conflicts',
  'messages',
  'sessions',
  'prompt_templates',
  'project_invitations',
  'project_collaborators',
  'projects',
  'users',
] as const;

async function globalSetup(): Promise<void> {
  console.log('[global-setup] Ensuring test database is clean...');

  // Wait for the API server to be ready and have run migrations
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:3099/api/health');
      if (response.ok) break;
    } catch {
      // API not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  // Truncate all tables to start with a clean state
  const client = new pg.Client({ connectionString: TEST_DB_URL });
  try {
    await client.connect();
    const tableList = APP_TABLES.join(', ');
    await client.query(`TRUNCATE ${tableList} CASCADE`);
    console.log('[global-setup] All tables truncated');
  } catch (err) {
    console.error('[global-setup] Error cleaning database:', err);
    throw err;
  } finally {
    await client.end();
  }
}

export default globalSetup;
