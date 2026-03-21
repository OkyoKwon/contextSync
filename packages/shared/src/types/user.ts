export interface User {
  readonly id: string;
  readonly githubId: number | null;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly role: UserRole;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type UserRole = 'owner' | 'admin' | 'member';

export interface NotificationSettings {
  readonly email: boolean;
  readonly slack: boolean;
  readonly slackWebhookUrl: string | null;
  readonly severityThreshold: 'info' | 'warning' | 'critical';
  readonly teamEvents: boolean;
}
