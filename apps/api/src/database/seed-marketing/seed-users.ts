import { db } from './helpers.js';

export async function seedUsers() {
  const userData = [
    { email: 'alex@contextsync.io', name: 'Alex Kim' },
    { email: 'sarah@contextsync.io', name: 'Sarah Chen' },
    { email: 'marcus@contextsync.io', name: 'Marcus Park' },
    { email: 'emily@contextsync.io', name: 'Emily Davis' },
  ] as const;

  const users: Array<{ id: string; email: string; name: string }> = [];

  for (const u of userData) {
    const row = await db
      .insertInto('users')
      .values({ email: u.email, name: u.name, avatar_url: null })
      .onConflict((oc) => oc.column('email').doUpdateSet({ name: u.name }))
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
      repo_url: 'https://github.com/contextsync/contextsync',
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function seedCollaborators(projectId: string, users: ReadonlyArray<{ id: string }>) {
  const roles = ['admin', 'member', 'member'] as const;
  for (let i = 1; i < users.length; i++) {
    await db
      .insertInto('project_collaborators')
      .values({
        project_id: projectId,
        user_id: users[i]!.id,
        role: roles[i - 1]!,
      })
      .execute();
  }
}
