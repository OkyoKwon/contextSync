import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('github_id', 'integer', (col) => col.notNull().unique())
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('avatar_url', 'varchar(512)')
    .addColumn('role', 'varchar(20)', (col) => col.notNull().defaultTo('member'))
    .addColumn('notification_settings', 'jsonb', (col) =>
      col.notNull().defaultTo(sql`'{"email":true,"slack":false,"slackWebhookUrl":null,"severityThreshold":"warning"}'`),
    )
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema.createIndex('idx_users_github_id').on('users').column('github_id').execute();
  await db.schema.createIndex('idx_users_email').on('users').column('email').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('users').execute();
}
