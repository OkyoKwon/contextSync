import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../channels/email.channel.js', () => ({
  createEmailChannel: vi.fn(),
  buildConflictEmailHtml: vi.fn(() => '<html>conflict</html>'),
}));

vi.mock('../channels/slack.channel.js', () => ({
  createSlackChannel: vi.fn(),
  buildConflictSlackMessage: vi.fn(() => ({ text: 'conflict alert' })),
}));

import { createEmailChannel } from '../channels/email.channel.js';
import { createSlackChannel } from '../channels/slack.channel.js';
import {
  notifyConflict,
  getUserNotificationSettings,
  updateUserNotificationSettings,
} from '../notification.service.js';

const mockCreateEmailChannel = createEmailChannel as ReturnType<typeof vi.fn>;
const mockCreateSlackChannel = createSlackChannel as ReturnType<typeof vi.fn>;

const mockEmailSend = vi.fn();
const mockSlackSend = vi.fn();

const db = {} as any;

const makeConflict = (overrides: Record<string, unknown> = {}) => ({
  id: 'conflict-1',
  projectId: 'proj-1',
  severity: 'warning',
  description: 'File conflict detected',
  status: 'detected',
  ...overrides,
});

const makeConfig = () => ({
  resendApiKey: 'test-key',
  emailFrom: 'noreply@test.com',
  frontendUrl: 'http://localhost:5173',
});

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateEmailChannel.mockReturnValue({ send: mockEmailSend });
  mockCreateSlackChannel.mockReturnValue({ send: mockSlackSend });
  mockEmailSend.mockResolvedValue(undefined);
  mockSlackSend.mockResolvedValue(undefined);
});

describe('notifyConflict', () => {
  it('should send email notification when user has email enabled', async () => {
    const mockExecuteTakeFirst = vi
      .fn()
      .mockResolvedValueOnce({
        notification_settings: JSON.stringify({
          email: true,
          slack: false,
          severityThreshold: 'info',
        }),
      })
      .mockResolvedValueOnce({ email: 'user@test.com' });

    const mockWhere = vi.fn().mockReturnValue({ executeTakeFirst: mockExecuteTakeFirst });
    const mockSelect = vi.fn().mockReturnValue({ where: mockWhere });
    (db as any).selectFrom = vi.fn().mockReturnValue({ select: mockSelect });

    await notifyConflict(db, makeConflict() as any, 'Test Project', ['user-1'], makeConfig());

    expect(mockEmailSend).toHaveBeenCalled();
    expect(mockSlackSend).not.toHaveBeenCalled();
  });

  it('should send slack notification when user has slack enabled', async () => {
    const mockExecuteTakeFirst = vi.fn().mockResolvedValueOnce({
      notification_settings: JSON.stringify({
        email: false,
        slack: true,
        slackWebhookUrl: 'https://hooks.slack.com/test',
        severityThreshold: 'info',
      }),
    });

    const mockWhere = vi.fn().mockReturnValue({ executeTakeFirst: mockExecuteTakeFirst });
    const mockSelect = vi.fn().mockReturnValue({ where: mockWhere });
    (db as any).selectFrom = vi.fn().mockReturnValue({ select: mockSelect });

    await notifyConflict(db, makeConflict() as any, 'Test Project', ['user-1'], makeConfig());

    expect(mockSlackSend).toHaveBeenCalled();
  });

  it('should skip notification when severity is below threshold', async () => {
    const mockExecuteTakeFirst = vi.fn().mockResolvedValueOnce({
      notification_settings: JSON.stringify({
        email: true,
        slack: true,
        severityThreshold: 'critical',
      }),
    });

    const mockWhere = vi.fn().mockReturnValue({ executeTakeFirst: mockExecuteTakeFirst });
    const mockSelect = vi.fn().mockReturnValue({ where: mockWhere });
    (db as any).selectFrom = vi.fn().mockReturnValue({ select: mockSelect });

    await notifyConflict(
      db,
      makeConflict({ severity: 'info' }) as any,
      'Test Project',
      ['user-1'],
      makeConfig(),
    );

    expect(mockEmailSend).not.toHaveBeenCalled();
    expect(mockSlackSend).not.toHaveBeenCalled();
  });

  it('should skip user when notification settings are null', async () => {
    const mockExecuteTakeFirst = vi.fn().mockResolvedValueOnce(null);
    const mockWhere = vi.fn().mockReturnValue({ executeTakeFirst: mockExecuteTakeFirst });
    const mockSelect = vi.fn().mockReturnValue({ where: mockWhere });
    (db as any).selectFrom = vi.fn().mockReturnValue({ select: mockSelect });

    await notifyConflict(db, makeConflict() as any, 'Test Project', ['user-1'], makeConfig());

    expect(mockEmailSend).not.toHaveBeenCalled();
    expect(mockSlackSend).not.toHaveBeenCalled();
  });

  it('should handle empty userIds array', async () => {
    await notifyConflict(db, makeConflict() as any, 'Test Project', [], makeConfig());

    expect(mockEmailSend).not.toHaveBeenCalled();
    expect(mockSlackSend).not.toHaveBeenCalled();
  });
});

describe('getUserNotificationSettings', () => {
  it('should return parsed notification settings', async () => {
    const settings = { email: true, slack: false, severityThreshold: 'warning' };
    const mockExecuteTakeFirst = vi.fn().mockResolvedValue({
      notification_settings: JSON.stringify(settings),
    });
    const mockWhere = vi.fn().mockReturnValue({ executeTakeFirst: mockExecuteTakeFirst });
    const mockSelect = vi.fn().mockReturnValue({ where: mockWhere });
    (db as any).selectFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const result = await getUserNotificationSettings(db, 'user-1');

    expect(result).toEqual({ teamEvents: true, ...settings });
  });

  it('should return null when user is not found', async () => {
    const mockExecuteTakeFirst = vi.fn().mockResolvedValue(undefined);
    const mockWhere = vi.fn().mockReturnValue({ executeTakeFirst: mockExecuteTakeFirst });
    const mockSelect = vi.fn().mockReturnValue({ where: mockWhere });
    (db as any).selectFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const result = await getUserNotificationSettings(db, 'nonexistent');

    expect(result).toBeNull();
  });

  it('should handle already-parsed object settings', async () => {
    const settings = { email: true, slack: false, severityThreshold: 'info' };
    const mockExecuteTakeFirst = vi.fn().mockResolvedValue({
      notification_settings: settings,
    });
    const mockWhere = vi.fn().mockReturnValue({ executeTakeFirst: mockExecuteTakeFirst });
    const mockSelect = vi.fn().mockReturnValue({ where: mockWhere });
    (db as any).selectFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const result = await getUserNotificationSettings(db, 'user-1');

    expect(result).toEqual({ teamEvents: true, ...settings });
  });
});

describe('updateUserNotificationSettings', () => {
  it('should update and return the new settings', async () => {
    const settings = { email: true, slack: true, severityThreshold: 'warning' } as any;
    const mockExecute = vi.fn().mockResolvedValue(undefined);
    const mockWhere = vi.fn().mockReturnValue({ execute: mockExecute });
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    (db as any).updateTable = vi.fn().mockReturnValue({ set: mockSet });

    const result = await updateUserNotificationSettings(db, 'user-1', settings);

    expect(result).toEqual(settings);
    expect(mockSet).toHaveBeenCalledWith({
      notification_settings: JSON.stringify(settings),
      updated_at: expect.any(Date),
    });
  });
});
