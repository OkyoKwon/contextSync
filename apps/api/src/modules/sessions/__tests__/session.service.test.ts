import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../session.repository.js', () => ({
  findSessionsByProjectId: vi.fn(),
  findSessionById: vi.fn(),
  findMessagesBySessionId: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
}));

vi.mock('../../projects/project.service.js', () => ({
  assertProjectAccess: vi.fn(),
}));

vi.mock('../../activity/activity.service.js', () => ({
  logActivity: vi.fn(),
}));

vi.mock('../local-session.service.js', () => ({
  countLocalSessionsByDate: vi.fn(),
}));

import * as sessionRepo from '../session.repository.js';
import { assertProjectAccess } from '../../projects/project.service.js';
import { logActivity } from '../../activity/activity.service.js';
import {
  getSessionsByProject,
  getSessionDetail,
  updateSession,
  deleteSession,
  getTimeline,
} from '../session.service.js';
import { NotFoundError } from '../../../plugins/error-handler.plugin.js';

const mockFindSessionsByProjectId = sessionRepo.findSessionsByProjectId as ReturnType<typeof vi.fn>;
const mockFindSessionById = sessionRepo.findSessionById as ReturnType<typeof vi.fn>;
const mockFindMessagesBySessionId = sessionRepo.findMessagesBySessionId as ReturnType<typeof vi.fn>;
const mockUpdateSession = sessionRepo.updateSession as ReturnType<typeof vi.fn>;
const mockDeleteSession = sessionRepo.deleteSession as ReturnType<typeof vi.fn>;
const mockAssertProjectAccess = assertProjectAccess as ReturnType<typeof vi.fn>;
const mockLogActivity = logActivity as ReturnType<typeof vi.fn>;

const db = {} as any;

const makeSession = (overrides: Record<string, unknown> = {}) => ({
  id: 'sess-1',
  projectId: 'proj-1',
  userId: 'user-1',
  title: 'Test Session',
  source: 'manual',
  status: 'active',
  filePaths: [],
  moduleNames: [],
  branch: null,
  tags: [],
  metadata: {},
  userName: 'Test User',
  userAvatarUrl: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

const makeMessage = (overrides: Record<string, unknown> = {}) => ({
  id: 'msg-1',
  sessionId: 'sess-1',
  role: 'user',
  content: 'Hello',
  contentType: 'prompt',
  tokensUsed: null,
  modelUsed: null,
  sortOrder: 0,
  createdAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertProjectAccess.mockResolvedValue(makeSession());
});

describe('getSessionsByProject', () => {
  it('should return sessions after access check', async () => {
    const expected = { sessions: [makeSession()], total: 1 };
    mockFindSessionsByProjectId.mockResolvedValue(expected);

    const result = await getSessionsByProject(db, 'proj-1', 'user-1', {});

    expect(mockAssertProjectAccess).toHaveBeenCalledWith(db, 'proj-1', 'user-1');
    expect(result).toEqual(expected);
  });

  it('should pass filter to repository', async () => {
    const filter = { status: 'active' as const, page: 2, limit: 10 };
    mockFindSessionsByProjectId.mockResolvedValue({ sessions: [], total: 0 });

    await getSessionsByProject(db, 'proj-1', 'user-1', filter);

    expect(mockFindSessionsByProjectId).toHaveBeenCalledWith(db, 'proj-1', filter);
  });

  it('should throw when user has no project access', async () => {
    mockAssertProjectAccess.mockRejectedValue(new Error('Forbidden'));

    await expect(getSessionsByProject(db, 'proj-1', 'user-1', {})).rejects.toThrow();
  });
});

describe('getSessionDetail', () => {
  it('should return session with messages', async () => {
    const session = makeSession();
    const messages = [makeMessage()];
    mockFindSessionById.mockResolvedValue(session);
    mockFindMessagesBySessionId.mockResolvedValue(messages);

    const result = await getSessionDetail(db, 'sess-1', 'user-1');

    expect(result).toEqual({ ...session, messages });
  });

  it('should throw NotFoundError when session does not exist', async () => {
    mockFindSessionById.mockResolvedValue(null);

    await expect(getSessionDetail(db, 'nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
  });

  it('should check project access using session projectId', async () => {
    const session = makeSession({ projectId: 'proj-99' });
    mockFindSessionById.mockResolvedValue(session);
    mockFindMessagesBySessionId.mockResolvedValue([]);

    await getSessionDetail(db, 'sess-1', 'user-1');

    expect(mockAssertProjectAccess).toHaveBeenCalledWith(db, 'proj-99', 'user-1');
  });
});

describe('updateSession', () => {
  it('should update session after access check', async () => {
    const session = makeSession();
    const updated = makeSession({ title: 'Updated Title' });
    mockFindSessionById.mockResolvedValue(session);
    mockUpdateSession.mockResolvedValue(updated);

    const result = await updateSession(db, 'sess-1', 'user-1', { title: 'Updated Title' });

    expect(result).toEqual(updated);
  });

  it('should throw NotFoundError when session does not exist', async () => {
    mockFindSessionById.mockResolvedValue(null);

    await expect(updateSession(db, 'nonexistent', 'user-1', {})).rejects.toThrow(NotFoundError);
  });

  it('should log activity when status is changed to completed', async () => {
    const session = makeSession({ title: 'My Session' });
    mockFindSessionById.mockResolvedValue(session);
    mockUpdateSession.mockResolvedValue(makeSession({ status: 'completed' }));

    await updateSession(db, 'sess-1', 'user-1', { status: 'completed' });

    expect(mockLogActivity).toHaveBeenCalledWith(db, {
      projectId: 'proj-1',
      userId: 'user-1',
      action: 'session_completed',
      entityType: 'session',
      entityId: 'sess-1',
      metadata: { title: 'My Session' },
    });
  });

  it('should not log activity when status is not completed', async () => {
    const session = makeSession();
    mockFindSessionById.mockResolvedValue(session);
    mockUpdateSession.mockResolvedValue(makeSession());

    await updateSession(db, 'sess-1', 'user-1', { title: 'New Title' });

    expect(mockLogActivity).not.toHaveBeenCalled();
  });
});

describe('deleteSession', () => {
  it('should delete session after access check', async () => {
    const session = makeSession();
    mockFindSessionById.mockResolvedValue(session);

    await deleteSession(db, 'sess-1', 'user-1');

    expect(mockDeleteSession).toHaveBeenCalledWith(db, 'sess-1');
  });

  it('should throw NotFoundError when session does not exist', async () => {
    mockFindSessionById.mockResolvedValue(null);

    await expect(deleteSession(db, 'nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
  });
});

describe('getTimeline', () => {
  it('should return timeline entries mapped from sessions', async () => {
    const session = makeSession({
      filePaths: ['src/index.ts'],
      userName: 'Test User',
      userAvatarUrl: null,
    });
    mockFindSessionsByProjectId.mockResolvedValue({ sessions: [session], total: 1 });

    const result = await getTimeline(db, 'proj-1', 'user-1', {});

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toEqual({
      id: 'sess-1',
      title: 'Test Session',
      source: 'manual',
      filePaths: ['src/index.ts'],
      userName: 'Test User',
      userAvatarUrl: null,
      createdAt: '2025-01-01T00:00:00.000Z',
    });
    expect(result.total).toBe(1);
  });

  it('should default userName to Unknown when not present', async () => {
    const session = makeSession({ userName: undefined, userAvatarUrl: undefined });
    mockFindSessionsByProjectId.mockResolvedValue({ sessions: [session], total: 1 });

    const result = await getTimeline(db, 'proj-1', 'user-1', {});

    expect(result.entries[0]?.userName).toBe('Unknown');
  });
});
