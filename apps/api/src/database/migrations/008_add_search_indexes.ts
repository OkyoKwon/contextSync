import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS search_vector tsvector`.execute(db);
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS search_vector tsvector`.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_search ON sessions USING GIN(search_vector)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_messages_search ON messages USING GIN(search_vector)`.execute(db);

  await sql`
    CREATE OR REPLACE FUNCTION update_session_search_vector() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector := to_tsvector('simple',
        coalesce(NEW.title, '') || ' ' ||
        coalesce(array_to_string(NEW.tags, ' '), '') || ' ' ||
        coalesce(array_to_string(NEW.file_paths, ' '), '') || ' ' ||
        coalesce(array_to_string(NEW.module_names, ' '), '')
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `.execute(db);

  await sql`
    CREATE TRIGGER trg_sessions_search_vector
      BEFORE INSERT OR UPDATE ON sessions
      FOR EACH ROW EXECUTE FUNCTION update_session_search_vector()
  `.execute(db);

  await sql`
    CREATE OR REPLACE FUNCTION update_message_search_vector() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector := to_tsvector('simple', coalesce(NEW.content, ''));
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `.execute(db);

  await sql`
    CREATE TRIGGER trg_messages_search_vector
      BEFORE INSERT OR UPDATE ON messages
      FOR EACH ROW EXECUTE FUNCTION update_message_search_vector()
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TRIGGER IF EXISTS trg_messages_search_vector ON messages`.execute(db);
  await sql`DROP TRIGGER IF EXISTS trg_sessions_search_vector ON sessions`.execute(db);
  await sql`DROP FUNCTION IF EXISTS update_message_search_vector`.execute(db);
  await sql`DROP FUNCTION IF EXISTS update_session_search_vector`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_messages_search`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_sessions_search`.execute(db);
  await sql`ALTER TABLE messages DROP COLUMN IF EXISTS search_vector`.execute(db);
  await sql`ALTER TABLE sessions DROP COLUMN IF EXISTS search_vector`.execute(db);
}
