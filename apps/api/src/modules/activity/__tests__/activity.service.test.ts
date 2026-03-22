import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../activity.repository.js', () => ({
  insertActivity: vi.fn(),
  findActivitiesByProjectId: vi.fn(),
}));

vi.mock('../../projects/project.service.js', () => ({
  assertProjectAccess: vi.fn(),
}));

import * as activityRepo from '../activity.repository.js';
import { assertProjectAccess } from '../../projects/project.service.js';
import { logActivity, getProjectActivity } from '../activity.service.js';

const mockInsertActivity = activityRepo.insertActivity as ReturnType<typeof vi.fn>;
const mockFindActivities = activityRepo.findActivitiesByProjectId as ReturnType<typeof vi.fn>;
const mockAssertProjectAccess = assertProjectAccess as ReturnType<typeof vi.fn>;

const db = {} as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertProjectAccess.mockResolvedValue({});
});

describe('logActivity', () => {
  it('should call insertActivity with provided input', () => {
    mockInsertActivity.mockResolvedValue(undefined);

    const input = {
      projectId: 'proj-1',
      userId: 'user-1',
      action: 'session_completed' as const,
      entityType: 'session',
      entityId: 'sess-1',
      metadata: { title: 'Test' },
    };

    logActivity(db, input);

    expect(mockInsertActivity).toHaveBeenCalledWith(db, input);
  });

  it('should not throw when insertActivity rejects (fire-and-forget)', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockInsertActivity.mockRejectedValue(new Error('DB error'));

    logActivity(db, {
      projectId: 'proj-1',
      userId: 'user-1',
      action: 'session_completed' as const,
      entityType: 'session',
    });

    // Wait for the promise rejection to be caught
    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('[activity] Failed to log activity:', 'DB error');
    });

    consoleSpy.mockRestore();
  });

  it('should handle input without optional fields', () => {
    mockInsertActivity.mockResolvedValue(undefined);

    logActivity(db, {
      projectId: 'proj-1',
      userId: 'user-1',
      action: 'collaborator_added' as const,
      entityType: 'collaborator',
    });

    expect(mockInsertActivity).toHaveBeenCalled();
  });
});

describe('getProjectActivity', () => {
  it('should return activities after access check', async () => {
    const expected = {
      entries: [{ id: 'act-1', action: 'session_completed' }],
      total: 1,
    };
    mockFindActivities.mockResolvedValue(expected);

    const result = await getProjectActivity(db, 'proj-1', 'user-1', 1, 20);

    expect(mockAssertProjectAccess).toHaveBeenCalledWith(db, 'proj-1', 'user-1');
    expect(mockFindActivities).toHaveBeenCalledWith(db, 'proj-1', 1, 20);
    expect(result).toEqual(expected);
  });

  it('should throw when user has no project access', async () => {
    mockAssertProjectAccess.mockRejectedValue(new Error('Forbidden'));

    await expect(getProjectActivity(db, 'proj-1', 'user-1', 1, 20)).rejects.toThrow('Forbidden');
  });

  it('should pass pagination parameters to repository', async () => {
    mockFindActivities.mockResolvedValue({ entries: [], total: 0 });

    await getProjectActivity(db, 'proj-1', 'user-1', 3, 50);

    expect(mockFindActivities).toHaveBeenCalledWith(db, 'proj-1', 3, 50);
  });
});
