import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('rate_limit_snapshots')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(db.fn('gen_random_uuid')))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('requests_limit', 'integer')
    .addColumn('requests_remaining', 'integer')
    .addColumn('requests_reset', 'varchar(64)')
    .addColumn('tokens_limit', 'integer')
    .addColumn('tokens_remaining', 'integer')
    .addColumn('tokens_reset', 'varchar(64)')
    .addColumn('input_tokens_limit', 'integer')
    .addColumn('input_tokens_remaining', 'integer')
    .addColumn('input_tokens_reset', 'varchar(64)')
    .addColumn('output_tokens_limit', 'integer')
    .addColumn('output_tokens_remaining', 'integer')
    .addColumn('output_tokens_reset', 'varchar(64)')
    .addColumn('captured_at', 'timestamptz', (col) => col.notNull().defaultTo(db.fn('now')))
    .execute();

  await db.schema
    .createIndex('idx_rate_limit_snapshots_user_captured')
    .on('rate_limit_snapshots')
    .columns(['user_id', 'captured_at'])
    .execute();

  await db.schema.alterTable('users').addColumn('plan_detection_source', 'varchar(20)').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('users').dropColumn('plan_detection_source').execute();
  await db.schema.dropTable('rate_limit_snapshots').execute();
}
