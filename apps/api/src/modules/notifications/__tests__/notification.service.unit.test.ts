import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../channels/email.channel.js', () => ({
  createEmailChannel: vi.fn(() => ({ send: vi.fn() })),
  buildConflictEmailHtml: vi.fn(() => '<html>conflict</html>'),
}));

vi.mock('../channels/slack.channel.js', () => ({
  createSlackChannel: vi.fn(() => ({ send: vi.fn() })),
  buildConflictSlackMessage: vi.fn(() => ({ text: 'conflict' })),
}));

import {
  notifyConflict,
  notifyTeamEvent,
  getUserNotificationSettings,
  updateUserNotificationSettings,
} from '../notification.service.js';
import { createEmailChannel } from '../channels/email.channel.js';
import { createSlackChannel } from '../channels/slack.channel.js';

function createMockDb() {
  const executeTakeFirst = vi.fn();
  const execute = vi.fn().mockResolvedValue(undefined);

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.executeTakeFirst = executeTakeFirst;
  chain.execute = execute;

  return {
    selectFrom: vi.fn().mockReturnValue(chain),
    updateTable: vi.fn().mockReturnValue(chain),
    _chain: chain,
    _executeTakeFirst: executeTakeFirst,
    _execute: execute,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getUserNotificationSettings', () => {
  it('should return parsed settings when user exists', async () => {
    const db = createMockDb();
    const settings = { email: true, slack: false, severityThreshold: 'warning' };
    db._executeTakeFirst.mockResolvedValue({ notification_settings: JSON.stringify(settings) });

    const result = await getUserNotificationSettings(db, 'user-1');

    expect(result).toEqual({ teamEvents: true, ...settings });
  });

  it('should handle settings as object (already parsed)', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue({
      notification_settings: { email: true, slack: true },
    });

    const result = await getUserNotificationSettings(db, 'user-1');

    expect(result).toEqual({ teamEvents: true, email: true, slack: true });
  });

  it('should return null when user not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await getUserNotificationSettings(db, 'nonexistent');

    expect(result).toBeNull();
  });
});

describe('updateUserNotificationSettings', () => {
  it('should update settings and return them', async () => {
    const db = createMockDb();
    const settings = {
      email: true,
      slack: false,
      slackWebhookUrl: null,
      teamEvents: true,
      severityThreshold: 'critical' as const,
    };

    const result = await updateUserNotificationSettings(db, 'user-1', settings);

    expect(result).toEqual(settings);
    expect(db.updateTable).toHaveBeenCalledWith('users');
    expect(db._execute).toHaveBeenCalled();
  });
});

describe('notifyConflict', () => {
  it('should send email when user has email notifications enabled', async () => {
    const db = createMockDb();
    const mockEmailSend = vi.fn();
    vi.mocked(createEmailChannel).mockReturnValue({ send: mockEmailSend });

    // First call: notification settings
    db._executeTakeFirst.mockResolvedValueOnce({
      notification_settings: { email: true, slack: false, severityThreshold: 'info' },
    });
    // Second call: user email
    db._executeTakeFirst.mockResolvedValueOnce({ email: 'test@example.com' });

    await notifyConflict(
      db,
      { id: 'c-1', severity: 'critical', description: 'Test conflict' } as any,
      'TestProject',
      ['user-1'],
      { emailFrom: 'no-reply@test.com', frontendUrl: 'http://localhost' },
    );

    expect(mockEmailSend).toHaveBeenCalled();
  });

  it('should skip notification when severity below threshold', async () => {
    const db = createMockDb();
    const mockEmailSend = vi.fn();
    vi.mocked(createEmailChannel).mockReturnValue({ send: mockEmailSend });

    db._executeTakeFirst.mockResolvedValueOnce({
      notification_settings: { email: true, slack: false, severityThreshold: 'critical' },
    });

    await notifyConflict(
      db,
      { id: 'c-1', severity: 'info', description: 'Minor' } as any,
      'TestProject',
      ['user-1'],
      { emailFrom: 'no-reply@test.com', frontendUrl: 'http://localhost' },
    );

    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it('should skip when no notification settings', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);

    await notifyConflict(
      db,
      { id: 'c-1', severity: 'critical', description: 'Test' } as any,
      'TestProject',
      ['user-1'],
      { emailFrom: 'no-reply@test.com', frontendUrl: 'http://localhost' },
    );

    // Should not throw
  });

  it('should send slack when enabled with webhook', async () => {
    const db = createMockDb();
    const mockSlackSend = vi.fn();
    vi.mocked(createSlackChannel).mockReturnValue({ send: mockSlackSend });

    db._executeTakeFirst.mockResolvedValueOnce({
      notification_settings: {
        email: false,
        slack: true,
        slackWebhookUrl: 'https://hooks.slack.com/test',
        severityThreshold: 'info',
      },
    });

    await notifyConflict(
      db,
      { id: 'c-1', severity: 'warning', description: 'Test' } as any,
      'TestProject',
      ['user-1'],
      { emailFrom: 'no-reply@test.com', frontendUrl: 'http://localhost' },
    );

    expect(mockSlackSend).toHaveBeenCalledWith('https://hooks.slack.com/test', expect.any(Object));
  });
});

describe('notifyTeamEvent', () => {
  it('should send notification to collaborators excluding actor', async () => {
    const db = createMockDb();
    const mockEmailSend = vi.fn();
    vi.mocked(createEmailChannel).mockReturnValue({ send: mockEmailSend });

    // getProjectCollaboratorUserIds
    db._chain.execute.mockResolvedValueOnce([{ user_id: 'user-2' }]);
    // getProjectOwnerId
    db._executeTakeFirst.mockResolvedValueOnce({ owner_id: 'user-3' });
    // user-2 settings
    db._executeTakeFirst.mockResolvedValueOnce({
      notification_settings: { email: true, teamEvents: true, severityThreshold: 'info' },
    });
    // user-2 email
    db._executeTakeFirst.mockResolvedValueOnce({ email: 'user2@test.com' });
    // user-3 settings
    db._executeTakeFirst.mockResolvedValueOnce({
      notification_settings: { email: true, teamEvents: true, severityThreshold: 'info' },
    });
    // user-3 email
    db._executeTakeFirst.mockResolvedValueOnce({ email: 'user3@test.com' });

    await notifyTeamEvent(
      db,
      'proj-1',
      'collaborator_added',
      { projectName: 'Test', actorName: 'User1', detail: 'NewUser' },
      'user-1',
      { emailFrom: 'no-reply@test.com', frontendUrl: 'http://localhost' },
    );

    expect(mockEmailSend).toHaveBeenCalledTimes(2);
  });

  it('should skip users with teamEvents disabled', async () => {
    const db = createMockDb();
    const mockEmailSend = vi.fn();
    vi.mocked(createEmailChannel).mockReturnValue({ send: mockEmailSend });

    db._chain.execute.mockResolvedValueOnce([{ user_id: 'user-2' }]);
    db._executeTakeFirst.mockResolvedValueOnce({ owner_id: null });
    // user-2 settings with teamEvents disabled
    db._executeTakeFirst.mockResolvedValueOnce({
      notification_settings: { email: true, teamEvents: false, severityThreshold: 'info' },
    });

    await notifyTeamEvent(
      db,
      'proj-1',
      'session_created',
      { projectName: 'Test', actorName: 'User1' },
      'user-1',
      { emailFrom: 'no-reply@test.com', frontendUrl: 'http://localhost' },
    );

    expect(mockEmailSend).not.toHaveBeenCalled();
  });
});
