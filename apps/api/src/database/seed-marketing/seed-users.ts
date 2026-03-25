import { db } from './helpers.js';

const AVATAR_BASE = 'https://ui-avatars.com/api/?size=128&bold=true&color=fff';

export async function seedUsers() {
  const userData = [
    { email: 'alex@contextsync.io', name: 'Alex Kim', bg: '3b82f6' },
    { email: 'sarah@contextsync.io', name: 'Sarah Chen', bg: '8b5cf6' },
    { email: 'marcus@contextsync.io', name: 'Marcus Park', bg: '10b981' },
    { email: 'emily@contextsync.io', name: 'Emily Davis', bg: 'f59e0b' },
    { email: 'jason@contextsync.io', name: 'Jason Lee', bg: 'ef4444' },
    { email: 'mina@contextsync.io', name: 'Mina Tanaka', bg: 'ec4899' },
  ] as const;

  const users: Array<{ id: string; email: string; name: string }> = [];

  for (const u of userData) {
    const initials = u.name
      .split(' ')
      .map((w) => w[0])
      .join('');
    const avatarUrl = `${AVATAR_BASE}&name=${initials}&background=${u.bg}`;
    const row = await db
      .insertInto('users')
      .values({ email: u.email, name: u.name, avatar_url: avatarUrl })
      .onConflict((oc) => oc.column('email').doUpdateSet({ name: u.name, avatar_url: avatarUrl }))
      .returningAll()
      .executeTakeFirstOrThrow();
    users.push({ id: row.id, email: row.email, name: row.name });
  }

  return users;
}

export async function seedProject(ownerId: string) {
  return db
    .insertInto('projects')
    .values({
      owner_id: ownerId,
      name: 'ContextSync',
      description:
        'AI development context hub — manage sessions, PRD analysis, and plans with AI evaluation',
      repo_url: 'https://github.com/OkyoKwon/contextSync',
      database_mode: 'dual',
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function seedDesignSystemProject(ownerId: string) {
  return db
    .insertInto('projects')
    .values({
      owner_id: ownerId,
      name: 'Design System',
      description: 'UI component library with design tokens and accessibility-first components',
      repo_url: 'https://github.com/OkyoKwon/design-system',
      database_mode: 'local',
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function seedCollaborators(projectId: string, users: ReadonlyArray<{ id: string }>) {
  for (let i = 1; i < users.length; i++) {
    await db
      .insertInto('project_collaborators')
      .values({
        project_id: projectId,
        user_id: users[i]!.id,
        role: 'member',
      })
      .execute();
  }
}

export async function seedDesignSystemCollaborators(
  projectId: string,
  users: ReadonlyArray<{ id: string }>,
) {
  // Mina (index 5) is owner via project, Sarah (1) and Emily (3) are members
  const memberIndices = [1, 3];
  for (const idx of memberIndices) {
    await db
      .insertInto('project_collaborators')
      .values({
        project_id: projectId,
        user_id: users[idx]!.id,
        role: 'member',
      })
      .execute();
  }
}
