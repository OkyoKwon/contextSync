import type { Db } from '../../database/client.js';
import type { TeamDb } from '../../database/pool-manager.js';

export async function syncUserToRemote(
  localDb: Db,
  remoteDb: TeamDb,
  userId: string,
): Promise<void> {
  const user = await localDb
    .selectFrom('users')
    .select(['id', 'email', 'name', 'avatar_url'])
    .where('id', '=', userId)
    .executeTakeFirst();

  if (!user) return;

  await remoteDb
    .insertInto('users')
    .values({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    })
    .onConflict((oc) =>
      oc.column('id').doUpdateSet({
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      }),
    )
    .execute();
}

export async function syncMultipleUsersToRemote(
  localDb: Db,
  remoteDb: TeamDb,
  userIds: readonly string[],
): Promise<void> {
  if (userIds.length === 0) return;

  const users = await localDb
    .selectFrom('users')
    .select(['id', 'email', 'name', 'avatar_url'])
    .where('id', 'in', [...userIds])
    .execute();

  if (users.length === 0) return;

  for (const user of users) {
    await remoteDb
      .insertInto('users')
      .values({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      })
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
        }),
      )
      .execute();
  }
}
