import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../test-helpers/create-test-app.js';
import { authHeader } from '../../../test-helpers/auth-helper.js';

vi.mock('../notification.service.js', () => ({
  getUserNotificationSettings: vi.fn(),
  updateUserNotificationSettings: vi.fn(),
  notifyConflict: vi.fn(),
  notifyTeamEvent: vi.fn(),
}));

import * as notifService from '../notification.service.js';

const mockGetSettings = vi.mocked(notifService.getUserNotificationSettings);
const mockUpdateSettings = vi.mocked(notifService.updateUserNotificationSettings);

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Notification Routes Integration', () => {
  describe('GET /api/users/me/notification-settings', () => {
    it('should return notification settings', async () => {
      mockGetSettings.mockResolvedValue({
        email: true,
        slack: false,
        slackWebhookUrl: null,
        severityThreshold: 'warning',
        teamEvents: true,
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/users/me/notification-settings',
        headers: { authorization: await authHeader() },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.email).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/users/me/notification-settings',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/users/me/notification-settings', () => {
    it('should update settings', async () => {
      const settings = {
        email: false,
        slack: true,
        slackWebhookUrl: 'https://hooks.slack.com/test',
        severityThreshold: 'critical' as const,
        teamEvents: true,
      };
      mockUpdateSettings.mockResolvedValue(settings);

      const res = await app.inject({
        method: 'PUT',
        url: '/api/users/me/notification-settings',
        headers: { authorization: await authHeader() },
        payload: settings,
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.slack).toBe(true);
    });
  });
});
