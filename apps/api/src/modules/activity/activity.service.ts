import type { Db } from '../../database/client.js';
import type { ActivityAction, ActivityEntry } from '@context-sync/shared';
import { assertProjectAccess } from '../projects/project.service.js';
import * as activityRepo from './activity.repository.js';

export function logActivity(
  db: Db,
  input: {
    readonly projectId: string;
    readonly userId: string;
    readonly action: ActivityAction;
    readonly entityType: string;
    readonly entityId?: string;
    readonly metadata?: Record<string, unknown>;
  },
): void {
  activityRepo.insertActivity(db, input).catch(() => {
    // fire-and-forget: activity logging should not block main flow
  });
}

export async function getProjectActivity(
  db: Db,
  projectId: string,
  userId: string,
  page: number,
  limit: number,
): Promise<{ entries: readonly ActivityEntry[]; total: number }> {
  await assertProjectAccess(db, projectId, userId);
  return activityRepo.findActivitiesByProjectId(db, projectId, page, limit);
}
