import type { Db } from '../../database/client.js';

export async function updateUserPlanDetection(
  db: Db,
  userId: string,
  plan: string,
  source: string,
): Promise<void> {
  await db
    .updateTable('users')
    .set({
      claude_plan: plan,
      plan_detection_source: source,
      updated_at: new Date(),
    })
    .where('id', '=', userId)
    .execute();
}

export async function getUserPlanDetectionSource(db: Db, userId: string): Promise<string | null> {
  const row = await db
    .selectFrom('users')
    .select('plan_detection_source')
    .where('id', '=', userId)
    .executeTakeFirst();

  return row?.plan_detection_source ?? null;
}
