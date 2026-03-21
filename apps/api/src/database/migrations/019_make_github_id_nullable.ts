import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('users')
    .alterColumn('github_id', (col) => col.dropNotNull())
    .execute();

  await db.schema.dropIndex('idx_users_github_id').ifExists().execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createIndex('idx_users_github_id')
    .unique()
    .on('users')
    .column('github_id')
    .execute();

  await db.schema
    .alterTable('users')
    .alterColumn('github_id', (col) => col.setNotNull())
    .execute();
}
