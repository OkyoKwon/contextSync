import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Add search_vector columns
  await sql`ALTER TABLE sessions ADD COLUMN search_vector tsvector`.execute(db);
  await sql`ALTER TABLE messages ADD COLUMN search_vector tsvector`.execute(db);

  // Create GIN indexes for full-text search
  await sql`CREATE INDEX idx_sessions_search ON sessions USING GIN(search_vector)`.execute(db);
  await sql`CREATE INDEX idx_messages_search ON messages USING GIN(search_vector)`.execute(db);

  // Session search trigger
  await sql`
    CREATE OR REPLACE FUNCTION sessions_search_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.file_paths, ' '), '')), 'C');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `.execute(db);

  await sql`
    CREATE TRIGGER sessions_search_trigger
    BEFORE INSERT OR UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION sessions_search_update()
  `.execute(db);

  // Message search trigger
  await sql`
    CREATE OR REPLACE FUNCTION messages_search_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `.execute(db);

  await sql`
    CREATE TRIGGER messages_search_trigger
    BEFORE INSERT OR UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION messages_search_update()
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TRIGGER IF EXISTS messages_search_trigger ON messages`.execute(db);
  await sql`DROP FUNCTION IF EXISTS messages_search_update()`.execute(db);
  await sql`DROP TRIGGER IF EXISTS sessions_search_trigger ON sessions`.execute(db);
  await sql`DROP FUNCTION IF EXISTS sessions_search_update()`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_messages_search`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_sessions_search`.execute(db);
  await sql`ALTER TABLE messages DROP COLUMN IF EXISTS search_vector`.execute(db);
  await sql`ALTER TABLE sessions DROP COLUMN IF EXISTS search_vector`.execute(db);
}
