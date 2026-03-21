import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { Database } from './types.js';

async function main() {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString }),
    }),
  });

  console.log('Seeding database...');

  // Seed user 1
  const user1 = await db
    .insertInto('users')
    .values({
      email: 'dev@contextsync.local',
      name: 'Dev User',
      avatar_url: null,
    })
    .onConflict((oc) => oc.column('email').doNothing())
    .returningAll()
    .executeTakeFirst();

  // Dev user 2 (collaborator)
  const user2 = await db
    .insertInto('users')
    .values({
      email: 'collaborator@contextsync.local',
      name: 'Dev Collaborator',
      avatar_url: null,
    })
    .onConflict((oc) => oc.column('email').doNothing())
    .returningAll()
    .executeTakeFirst();

  if (!user1 || !user2) {
    console.log('Users already exist, fetching...');
    const existingUsers = await db
      .selectFrom('users')
      .selectAll()
      .where('email', 'in', ['dev@contextsync.local', 'collaborator@contextsync.local'])
      .orderBy('email', 'asc')
      .execute();

    if (existingUsers.length < 2) {
      console.error('Could not find or create seed users');
      await db.destroy();
      process.exit(1);
    }

    await seedData(db, existingUsers[0]!, existingUsers[1]!);
  } else {
    await seedData(db, user1, user2);
  }

  await db.destroy();
  console.log('Seed completed');
}

async function seedData(db: Kysely<Database>, user1: { id: string }, user2: { id: string }) {
  // Sample project
  const project = await db
    .insertInto('projects')
    .values({
      owner_id: user1.id,
      name: 'Sample Project',
      description: 'A sample project for exploring ContextSync features',
      repo_url: 'https://github.com/example/sample-project',
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  console.log(`  Created project: ${project.name}`);

  // Add user2 as collaborator
  await db
    .insertInto('project_collaborators')
    .values({
      project_id: project.id,
      user_id: user2.id,
      role: 'member',
    })
    .execute();

  console.log('  Added collaborator');

  // Sample sessions
  const sessions = await db
    .insertInto('sessions')
    .values([
      {
        project_id: project.id,
        user_id: user1.id,
        title: 'feat: Add user authentication flow',
        source: 'local',
        status: 'completed',
        file_paths: ['src/auth/login.ts', 'src/auth/middleware.ts', 'src/routes/auth.ts'],
        module_names: ['auth'],
        branch: 'feat/auth',
        tags: ['auth', 'feature'],
      },
      {
        project_id: project.id,
        user_id: user2.id,
        title: 'fix: Resolve database connection pooling issue',
        source: 'local',
        status: 'completed',
        file_paths: ['src/database/client.ts', 'src/config/database.ts'],
        module_names: ['database'],
        branch: 'fix/db-pool',
        tags: ['database', 'bugfix'],
      },
      {
        project_id: project.id,
        user_id: user1.id,
        title: 'refactor: Extract validation utilities',
        source: 'local',
        status: 'active',
        file_paths: ['src/utils/validate.ts', 'src/schemas/user.ts'],
        module_names: ['utils', 'schemas'],
        branch: 'refactor/validation',
        tags: ['refactor', 'utils'],
      },
    ])
    .returningAll()
    .execute();

  console.log(`  Created ${sessions.length} sessions`);

  // Sample messages for first session
  await db
    .insertInto('messages')
    .values([
      {
        session_id: sessions[0]!.id,
        role: 'human',
        content: 'I need to implement a login flow with JWT authentication.',
        content_type: 'text',
        sort_order: 1,
      },
      {
        session_id: sessions[0]!.id,
        role: 'assistant',
        content:
          "I'll help you implement JWT authentication. Let me create the auth module with login, token generation, and middleware for protected routes.",
        content_type: 'text',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1250,
        sort_order: 2,
      },
    ])
    .execute();

  console.log('  Created sample messages');

  // Sample conflict
  await db
    .insertInto('conflicts')
    .values({
      project_id: project.id,
      session_a_id: sessions[0]!.id,
      session_b_id: sessions[1]!.id,
      conflict_type: 'file_overlap',
      severity: 'warning',
      status: 'open',
      description: 'Both sessions modified database configuration files',
      overlapping_paths: ['src/config/database.ts'],
    })
    .execute();

  console.log('  Created sample conflict');

  // Activity log entries
  await db
    .insertInto('activity_log')
    .values([
      {
        project_id: project.id,
        user_id: user1.id,
        action: 'session.created',
        entity_type: 'session',
        entity_id: sessions[0]!.id,
      },
      {
        project_id: project.id,
        user_id: user2.id,
        action: 'session.created',
        entity_type: 'session',
        entity_id: sessions[1]!.id,
      },
      {
        project_id: project.id,
        user_id: user1.id,
        action: 'conflict.detected',
        entity_type: 'conflict',
      },
    ])
    .execute();

  console.log('  Created activity log entries');
}

main();
