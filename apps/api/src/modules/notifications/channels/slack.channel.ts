export interface SlackChannel {
  send(webhookUrl: string, message: SlackMessage): Promise<void>;
}

interface SlackMessage {
  readonly text: string;
  readonly blocks?: readonly Record<string, unknown>[];
}

export function createSlackChannel(): SlackChannel {
  return {
    async send(webhookUrl: string, message: SlackMessage): Promise<void> {
      if (!webhookUrl) {
        console.log('[Slack Skip] No webhook URL configured');
        return;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status}`);
      }
    },
  };
}

export function buildConflictSlackMessage(
  severity: string,
  description: string,
  projectName: string,
  dashboardUrl: string,
): SlackMessage {
  const emoji = { info: ':information_source:', warning: ':warning:', critical: ':rotating_light:' }[severity] ?? ':grey_question:';

  return {
    text: `${emoji} Context conflict detected in ${projectName}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${emoji} Context Conflict Detected` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Project:*\n${projectName}` },
          { type: 'mrkdwn', text: `*Severity:*\n${severity.toUpperCase()}` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: description },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View in ContextSync' },
            url: dashboardUrl,
            style: 'primary',
          },
        ],
      },
    ],
  };
}
