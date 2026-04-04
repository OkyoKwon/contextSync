import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../projects/project.service.js', () => ({
  assertProjectAccess: vi.fn(),
}));

vi.mock('../session.repository.js', () => ({
  findAllSessionsWithMessages: vi.fn(),
}));

import { assertProjectAccess } from '../../projects/project.service.js';
import { findAllSessionsWithMessages } from '../session.repository.js';
import { exportProjectAsMarkdown } from '../session-export.service.js';

const mockAssertAccess = vi.mocked(assertProjectAccess);
const mockFindAll = vi.mocked(findAllSessionsWithMessages);

const db = {} as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertAccess.mockResolvedValue({ name: 'Test Project' } as any);
});

describe('exportProjectAsMarkdown', () => {
  it('should export markdown with sessions', async () => {
    mockFindAll.mockResolvedValue([
      {
        session: {
          id: 'sess-1',
          title: 'Session 1',
          source: 'manual',
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          filePaths: [],
          moduleNames: [],
          branch: null,
          tags: [],
          metadata: {},
          projectId: 'proj-1',
          userId: 'user-1',
        },
        messages: [
          {
            id: 'msg-1',
            sessionId: 'sess-1',
            role: 'user',
            content: 'Hello',
            contentType: 'prompt',
            tokensUsed: null,
            modelUsed: null,
            sortOrder: 0,
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        ],
      },
    ]);

    const result = await exportProjectAsMarkdown(db, 'proj-1', 'user-1');

    expect(result.projectName).toBe('Test Project');
    expect(result.markdown).toContain('Test Project');
    expect(result.markdown).toContain('Sessions Export');
    expect(result.markdown).toContain('Session 1');
  });

  it('should handle empty sessions', async () => {
    mockFindAll.mockResolvedValue([]);

    const result = await exportProjectAsMarkdown(db, 'proj-1', 'user-1');

    expect(result.markdown).toContain('No sessions found');
  });

  it('should check project access', async () => {
    mockFindAll.mockResolvedValue([]);

    await exportProjectAsMarkdown(db, 'proj-1', 'user-1');

    expect(mockAssertAccess).toHaveBeenCalledWith(db, 'proj-1', 'user-1');
  });
});
