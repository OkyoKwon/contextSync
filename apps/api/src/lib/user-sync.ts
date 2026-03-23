import type { Db } from '../database/client.js';
import type { User } from '@context-sync/shared';

/**
 * Replicate a user record to the remote database.
 * Uses upsert (INSERT ... ON CONFLICT DO UPDATE) so it's safe to call repeatedly.
 * Only syncs fields needed for FK references and display (id, name, email, avatar_url).
 */
export async function syncUserToRemote(remoteDb: Db, user: User): Promise<void> {
  await remoteDb
    .insertInto('users')
    .values({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatarUrl ?? null,
      is_auto: false,
    })
    .onConflict((oc) =>
      oc.column('id').doUpdateSet({
        name: user.name,
        avatar_url: user.avatarUrl ?? null,
        updated_at: new Date(),
      }),
    )
    .execute();
}
