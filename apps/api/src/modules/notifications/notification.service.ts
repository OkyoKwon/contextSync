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
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
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
