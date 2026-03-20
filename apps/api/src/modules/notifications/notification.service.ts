import type { Db } from '../../database/client.js';
import type { Conflict, NotificationSettings } from '@context-sync/shared';
import { createEmailChannel, buildConflictEmailHtml } from './channels/email.channel.js';
import { createSlackChannel, buildConflictSlackMessage } from './channels/slack.channel.js';

interface NotificationConfig {
  readonly resendApiKey?: string;
  readonly emailFrom: string;
  readonly frontendUrl: string;
}

const SEVERITY_ORDER = { info: 0, warning: 1, critical: 2 } as const;

export async function notifyConflict(
  db: Db,
  conflict: Conflict,
  projectName: string,
  userIds: readonly string[],
  config: NotificationConfig,
): Promise<void> {
  const emailChannel = createEmailChannel(config.resendApiKey, config.emailFrom);
  const slackChannel = createSlackChannel();
  const dashboardUrl = `${config.frontendUrl}/conflicts/${conflict.id}`;

  for (const userId of userIds) {
    const settings = await getUserNotificationSettings(db, userId);
    if (!settings) continue;

    const threshold = SEVERITY_ORDER[settings.severityThreshold] ?? 0;
    const conflictLevel = SEVERITY_ORDER[conflict.severity as keyof typeof SEVERITY_ORDER] ?? 0;
    if (conflictLevel < threshold) continue;

    if (settings.email) {
      const email = await getUserEmail(db, userId);
      if (email) {
        const html = buildConflictEmailHtml(
          conflict.severity,
          conflict.description,
          projectName,
          dashboardUrl,
        );
        await emailChannel.send(email, `[ContextSync] ${conflict.severity.toUpperCase()} conflict in ${projectName}`, html);
      }
    }

    if (settings.slack && settings.slackWebhookUrl) {
      const message = buildConflictSlackMessage(
        conflict.severity,
        conflict.description,
        projectName,
        dashboardUrl,
      );
      await slackChannel.send(settings.slackWebhookUrl, message);
    }
  }
}

export type TeamEventType =
  | 'collaborator_added'
  | 'collaborator_removed'
  | 'session_created';

export async function notifyTeamEvent(
  db: Db,
  projectId: string,
  eventType: TeamEventType,
  eventData: { readonly projectName: string; readonly actorName: string; readonly detail?: string },
  excludeUserId: string,
  config: NotificationConfig,
): Promise<void> {
  const collaboratorIds = await getProjectCollaboratorUserIds(db, projectId);
  const ownerId = await getProjectOwnerId(db, projectId);
  const targetUserIds = [...collaboratorIds, ...(ownerId ? [ownerId] : [])].filter(
    (id) => id !== excludeUserId,
  );

  const emailChannel = createEmailChannel(config.resendApiKey, config.emailFrom);
  const slackChannel = createSlackChannel();

  const subjects: Record<TeamEventType, string> = {
    collaborator_added: `[ContextSync] New member joined ${eventData.projectName}`,
    collaborator_removed: `[ContextSync] Member left ${eventData.projectName}`,
    session_created: `[ContextSync] New session in ${eventData.projectName}`,
  };

  const descriptions: Record<TeamEventType, string> = {
    collaborator_added: `${eventData.actorName} added a new collaborator${eventData.detail ? `: ${eventData.detail}` : ''}`,
    collaborator_removed: `${eventData.actorName} removed a collaborator${eventData.detail ? `: ${eventData.detail}` : ''}`,
    session_created: `${eventData.actorName} created a new session${eventData.detail ? `: ${eventData.detail}` : ''}`,
  };

  const subject = subjects[eventType];
  const description = descriptions[eventType];

  for (const userId of targetUserIds) {
    const settings = await getUserNotificationSettings(db, userId);
    if (!settings) continue;

    const teamEvents = settings.teamEvents ?? true;
    if (!teamEvents) continue;

    if (settings.email) {
      const email = await getUserEmail(db, userId);
      if (email) {
        const html = `<p>${description}</p><p>Project: ${eventData.projectName}</p>`;
        await emailChannel.send(email, subject, html);
      }
    }

    if (settings.slack && settings.slackWebhookUrl) {
      await slackChannel.send(settings.slackWebhookUrl, {
        text: `${subject}\n${description}`,
      });
    }
  }
}

export async function getUserNotificationSettings(
  db: Db,
  userId: string,
): Promise<NotificationSettings | null> {
  const row = await db
    .selectFrom('users')
    .select('notification_settings')
    .where('id', '=', userId)
    .executeTakeFirst();

  if (!row) return null;

  const raw = row.notification_settings;
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return { teamEvents: true, ...parsed };
}

export async function updateUserNotificationSettings(
  db: Db,
  userId: string,
  settings: NotificationSettings,
): Promise<NotificationSettings> {
  await db
    .updateTable('users')
    .set({ notification_settings: JSON.stringify(settings), updated_at: new Date() })
    .where('id', '=', userId)
    .execute();

  return settings;
}

async function getUserEmail(db: Db, userId: string): Promise<string | null> {
  const row = await db
    .selectFrom('users')
    .select('email')
    .where('id', '=', userId)
    .executeTakeFirst();
  return row?.email ?? null;
}

async function getProjectCollaboratorUserIds(db: Db, projectId: string): Promise<readonly string[]> {
  const rows = await db
    .selectFrom('project_collaborators')
    .select('user_id')
    .where('project_id', '=', projectId)
    .execute();
  return rows.map((r) => r.user_id);
}

async function getProjectOwnerId(db: Db, projectId: string): Promise<string | null> {
  const row = await db
    .selectFrom('projects')
    .select('owner_id')
    .where('id', '=', projectId)
    .executeTakeFirst();
  return row?.owner_id ?? null;
}
