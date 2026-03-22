import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Add join_code column to projects
  await db.schema
    .alterTable('projects')
    .addColumn('join_code', 'varchar(8)', (col) => col.unique())
    .execute();

  // Drop tables that are no longer needed
  await db.schema.dropTable('data_migration_jobs').ifExists().execute();
  await db.schema.dropTable('project_db_configs').ifExists().execute();
  await db.schema.dropTable('project_invitations').ifExists().execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Remove join_code from projects
  await db.schema.alterTable('projects').dropColumn('join_code').execute();

  // Re-create dropped tables
  await db.schema
    .createTable('project_invitations')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('project_id', 'uuid', (col) =>
      col.references('projects.id').onDelete('cascade').notNull(),
    )
    .addColumn('inviter_id', 'uuid', (col) =>
      col.references('users.id').onDelete('cascade').notNull(),
    )
    .addColumn('email', 'varchar(255)', (col) => col.notNull())
    .addColumn('token', 'varchar(255)', (col) => col.unique().notNull())
    .addColumn('role', 'varchar(50)', (col) => col.defaultTo('member').notNull())
    .addColumn('status', 'varchar(50)', (col) => col.defaultTo('pending').notNull())
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('accepted_at', 'timestamptz')
    .addColumn('declined_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createTable('project_db_configs')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('project_id', 'uuid', (col) =>
      col.references('projects.id').onDelete('cascade').notNull().unique(),
    )
    .addColumn('provider', 'varchar(50)', (col) => col.defaultTo('self-hosted').notNull())
    .addColumn('connection_url', 'text', (col) => col.notNull())
    .addColumn('ssl_enabled', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('status', 'varchar(50)', (col) => col.defaultTo('pending').notNull())
    .addColumn('schema_version', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('migrated_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createTable('data_migration_jobs')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('project_id', 'uuid', (col) =>
      col.references('projects.id').onDelete('cascade').notNull(),
    )
    .addColumn('direction', 'varchar(50)', (col) => col.defaultTo('local_to_remote').notNull())
    .addColumn('status', 'varchar(50)', (col) => col.defaultTo('pending').notNull())
    .addColumn('total_sessions', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('migrated_sessions', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('total_messages', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('migrated_messages', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('error_message', 'text')
    .addColumn('started_at', 'timestamptz')
    .addColumn('completed_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();
}
