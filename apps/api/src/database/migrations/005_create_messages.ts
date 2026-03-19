import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('messages')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('session_id', 'uuid', (col) => col.notNull().references('sessions.id').onDelete('cascade'))
    .addColumn('role', 'varchar(20)', (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('content_type', 'varchar(20)', (col) => col.notNull().defaultTo('prompt'))
    .addColumn('tokens_used', 'integer')
    .addColumn('model_used', 'varchar(100)')
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema.createIndex('idx_messages_session_id').on('messages').column('session_id').execute();
  await db.schema
    .createIndex('idx_messages_sort_order')
    .on('messages')
    .columns(['session_id', 'sort_order'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('messages').execute();
}
