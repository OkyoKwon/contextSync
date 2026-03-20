export interface EmailChannel {
  send(to: string, subject: string, html: string): Promise<void>;
}

export function createEmailChannel(apiKey: string | undefined, from: string): EmailChannel {
  return {
    async send(to: string, subject: string, html: string): Promise<void> {
      if (!apiKey) {
        console.log(`[Email Skip] No API key. Would send to ${to}: ${subject}`);
        return;
      }

      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);

      await resend.emails.send({
        from,
        to,
        subject,
        html,
      });
    },
  };
}

export function buildInvitationEmailHtml(
  inviterName: string,
  projectName: string,
  role: string,
  acceptUrl: string,
): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">You've been invited to a project</h2>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${projectName}</strong> as a <strong>${role}</strong>.</p>
      <a href="${acceptUrl}" style="display: inline-block; padding: 12px 24px; background: #2563EB; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Accept Invitation
      </a>
      <p style="color: #6B7280; font-size: 14px;">This invitation expires in 7 days.</p>
      <p style="color: #6B7280; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
  `;
}

export function buildConflictEmailHtml(
  severity: string,
  description: string,
  projectName: string,
  dashboardUrl: string,
): string {
  const severityColor =
    {
      info: '#3B82F6',
      warning: '#F59E0B',
      critical: '#EF4444',
    }[severity] ?? '#6B7280';

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${severityColor};">Context Conflict Detected</h2>
      <p><strong>Project:</strong> ${projectName}</p>
      <p><strong>Severity:</strong> <span style="color: ${severityColor}; text-transform: uppercase;">${severity}</span></p>
      <p>${description}</p>
      <a href="${dashboardUrl}" style="display: inline-block; padding: 10px 20px; background: #2563EB; color: white; text-decoration: none; border-radius: 6px;">
        View in ContextSync
      </a>
    </div>
  `;
}
