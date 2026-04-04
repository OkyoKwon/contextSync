import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../conflict.repository.js', () => ({
  existsConflictBetweenSessions: vi.fn(),
  createConflict: vi.fn(),
  findConflictsByProjectId: vi.fn(),
  findConflictById: vi.fn(),
  updateConflictStatus: vi.fn(),
  batchUpdateConflictStatus: vi.fn(),
  assignReviewer: vi.fn(),
  updateReviewNotes: vi.fn(),
  updateAiAnalysis: vi.fn(),
}));

vi.mock('../../projects/project.service.js', () => ({
  assertProjectAccess: vi.fn(),
}));

vi.mock('../conflict-detector.js', () => ({
  detectFileConflicts: vi.fn(),
}));

vi.mock('../../sessions/session.repository.js', () => ({
  findRecentSessionsByProject: vi.fn(),
  findSessionById: vi.fn(),
  findMessagesBySessionId: vi.fn(),
}));

vi.mock('../../activity/activity.service.js', () => ({
  logActivity: vi.fn(),
}));

vi.mock('../conflict-ai-analyzer.js', () => ({
  analyzeConflict: vi.fn(),
  analyzeConflictOverview: vi.fn(),
}));

import * as conflictRepo from '../conflict.repository.js';
import { assertProjectAccess } from '../../projects/project.service.js';
import { detectFileConflicts } from '../conflict-detector.js';
import {
  findRecentSessionsByProject,
  findSessionById,
  findMessagesBySessionId,
} from '../../sessions/session.repository.js';
import { logActivity } from '../../activity/activity.service.js';
import { analyzeConflict, analyzeConflictOverview } from '../conflict-ai-analyzer.js';
import {
  detectConflicts,
  saveDetectedConflicts,
  getConflictsByProject,
  getConflictDetail,
  updateConflictStatus,
  batchResolveConflicts,
  aiVerifyConflict,
  assignReviewer,
  addReviewNotes,
  getConflictOverview,
} from '../conflict.service.js';
import { NotFoundError, ForbiddenError, AppError } from '../../../plugins/error-handler.plugin.js';

const mockExistsConflict = conflictRepo.existsConflictBetweenSessions as ReturnType<typeof vi.fn>;
const mockCreateConflict = conflictRepo.createConflict as ReturnType<typeof vi.fn>;
const mockFindConflictsByProject = conflictRepo.findConflictsByProjectId as ReturnType<
  typeof vi.fn
>;
const mockFindConflictById = conflictRepo.findConflictById as ReturnType<typeof vi.fn>;
const mockUpdateConflictStatus = conflictRepo.updateConflictStatus as ReturnType<typeof vi.fn>;
const mockBatchUpdate = conflictRepo.batchUpdateConflictStatus as ReturnType<typeof vi.fn>;
const mockAssignReviewer = conflictRepo.assignReviewer as ReturnType<typeof vi.fn>;
const mockUpdateReviewNotes = conflictRepo.updateReviewNotes as ReturnType<typeof vi.fn>;
const mockUpdateAiAnalysis = conflictRepo.updateAiAnalysis as ReturnType<typeof vi.fn>;
const mockAssertProjectAccess = assertProjectAccess as ReturnType<typeof vi.fn>;
const mockDetectFileConflicts = detectFileConflicts as ReturnType<typeof vi.fn>;
const mockFindRecentSessions = findRecentSessionsByProject as ReturnType<typeof vi.fn>;
const mockFindSessionById = findSessionById as ReturnType<typeof vi.fn>;
const mockFindMessages = findMessagesBySessionId as ReturnType<typeof vi.fn>;
const mockLogActivity = logActivity as ReturnType<typeof vi.fn>;
const mockAnalyzeConflict = analyzeConflict as ReturnType<typeof vi.fn>;
const mockAnalyzeOverview = analyzeConflictOverview as ReturnType<typeof vi.fn>;

const db = {} as any;

const makeConflict = (overrides: Record<string, unknown> = {}) => ({
  id: 'conflict-1',
  projectId: 'proj-1',
  sessionAId: 'sess-a',
  sessionBId: 'sess-b',
  conflictType: 'file_overlap',
  severity: 'medium',
  status: 'detected',
  description: 'Test conflict',
  overlappingPaths: ['src/index.ts'],
  diffData: {},
  resolvedBy: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  resolvedAt: null,
  reviewerId: null,
  reviewNotes: null,
  assignedAt: null,
  aiVerdict: null,
  aiConfidence: null,
  aiOverlapType: null,
  aiSummary: null,
  aiRiskAreas: null,
  aiRecommendation: null,
  aiRecommendationDetail: null,
  aiAnalyzedAt: null,
  aiModelUsed: null,
  ...overrides,
});

const makeSession = (overrides: Record<string, unknown> = {}) => ({
  id: 'sess-1',
  projectId: 'proj-1',
  userId: 'user-1',
  title: 'Test Session',
  source: 'manual',
  status: 'active',
  filePaths: ['src/index.ts'],
  moduleNames: [],
  branch: null,
  tags: [],
  metadata: {},
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

const makeDetected = (overrides: Record<string, unknown> = {}) => ({
  sessionAId: 'sess-a',
  sessionBId: 'sess-b',
  conflictType: 'file_overlap',
  severity: 'medium',
  description: 'Overlapping files',
  overlappingPaths: ['src/index.ts'],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('detectConflicts', () => {
  it('should find recent sessions and detect file conflicts', async () => {
    const session = makeSession();
    const recentSessions = [makeSession({ id: 'sess-2', userId: 'user-2' })];
    const detected = [makeDetected()];

    mockFindRecentSessions.mockResolvedValue(recentSessions);
    mockDetectFileConflicts.mockReturnValue(detected);

    const result = await detectConflicts(db, session as any);

    expect(mockFindRecentSessions).toHaveBeenCalledWith(db, 'proj-1', 'user-1', expect.any(Number));
    expect(mockDetectFileConflicts).toHaveBeenCalledWith(session, recentSessions);
    expect(result).toEqual(detected);
  });

  it('should return empty array when no conflicts detected', async () => {
    mockFindRecentSessions.mockResolvedValue([]);
    mockDetectFileConflicts.mockReturnValue([]);

    const result = await detectConflicts(db, makeSession() as any);

    expect(result).toEqual([]);
  });
});

describe('saveDetectedConflicts', () => {
  it('should save new conflicts that do not already exist', async () => {
    const detected = [makeDetected()];
    const created = makeConflict();

    mockExistsConflict.mockResolvedValue(false);
    mockCreateConflict.mockResolvedValue(created);

    const result = await saveDetectedConflicts(db, 'proj-1', detected as any);

    expect(result).toHaveLength(1);
    expect(mockCreateConflict).toHaveBeenCalledWith(db, 'proj-1', detected[0]);
    expect(mockLogActivity).toHaveBeenCalled();
  });

  it('should skip conflicts that already exist between sessions', async () => {
    const detected = [makeDetected()];
    mockExistsConflict.mockResolvedValue(true);

    const result = await saveDetectedConflicts(db, 'proj-1', detected as any);

    expect(result).toHaveLength(0);
    expect(mockCreateConflict).not.toHaveBeenCalled();
  });

  it('should handle multiple detected conflicts', async () => {
    const detected = [
      makeDetected({ sessionAId: 'a1', sessionBId: 'b1' }),
      makeDetected({ sessionAId: 'a2', sessionBId: 'b2' }),
    ];

    mockExistsConflict.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockCreateConflict.mockResolvedValue(makeConflict());

    const result = await saveDetectedConflicts(db, 'proj-1', detected as any);

    expect(result).toHaveLength(1);
  });
});

describe('getConflictsByProject', () => {
  it('should return conflicts after access check', async () => {
    const expected = { conflicts: [makeConflict()], total: 1 };
    mockAssertProjectAccess.mockResolvedValue(undefined);
    mockFindConflictsByProject.mockResolvedValue(expected);

    const result = await getConflictsByProject(db, 'proj-1', 'user-1', {});

    expect(mockAssertProjectAccess).toHaveBeenCalledWith(db, 'proj-1', 'user-1');
    expect(result).toEqual(expected);
  });

  it('should throw when user has no access', async () => {
    mockAssertProjectAccess.mockRejectedValue(new ForbiddenError());

    await expect(getConflictsByProject(db, 'proj-1', 'user-1', {})).rejects.toThrow(ForbiddenError);
  });
});

describe('getConflictDetail', () => {
  it('should return conflict after access check', async () => {
    const conflict = makeConflict();
    mockFindConflictById.mockResolvedValue(conflict);
    mockAssertProjectAccess.mockResolvedValue(undefined);

    const result = await getConflictDetail(db, 'conflict-1', 'user-1');

    expect(result).toEqual(conflict);
  });

  it('should throw NotFoundError when conflict does not exist', async () => {
    mockFindConflictById.mockResolvedValue(null);

    await expect(getConflictDetail(db, 'nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
  });
});

describe('updateConflictStatus', () => {
  it('should update status after access check', async () => {
    const conflict = makeConflict();
    const updated = makeConflict({ status: 'resolved' });
    mockFindConflictById.mockResolvedValue(conflict);
    mockAssertProjectAccess.mockResolvedValue(undefined);
    mockUpdateConflictStatus.mockResolvedValue(updated);

    const result = await updateConflictStatus(db, 'conflict-1', 'user-1', 'resolved');

    expect(result.status).toBe('resolved');
  });

  it('should log activity when status is resolved', async () => {
    const conflict = makeConflict();
    mockFindConflictById.mockResolvedValue(conflict);
    mockAssertProjectAccess.mockResolvedValue(undefined);
    mockUpdateConflictStatus.mockResolvedValue(makeConflict({ status: 'resolved' }));

    await updateConflictStatus(db, 'conflict-1', 'user-1', 'resolved');

    expect(mockLogActivity).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        action: 'conflict_resolved',
        entityId: 'conflict-1',
      }),
    );
  });

  it('should log activity when status is dismissed', async () => {
    const conflict = makeConflict();
    mockFindConflictById.mockResolvedValue(conflict);
    mockAssertProjectAccess.mockResolvedValue(undefined);
    mockUpdateConflictStatus.mockResolvedValue(makeConflict({ status: 'dismissed' }));

    await updateConflictStatus(db, 'conflict-1', 'user-1', 'dismissed');

    expect(mockLogActivity).toHaveBeenCalled();
  });

  it('should not log activity for non-terminal statuses', async () => {
    const conflict = makeConflict();
    mockFindConflictById.mockResolvedValue(conflict);
    mockAssertProjectAccess.mockResolvedValue(undefined);
    mockUpdateConflictStatus.mockResolvedValue(makeConflict({ status: 'reviewing' }));

    await updateConflictStatus(db, 'conflict-1', 'user-1', 'reviewing');

    expect(mockLogActivity).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when conflict does not exist', async () => {
    mockFindConflictById.mockResolvedValue(null);

    await expect(updateConflictStatus(db, 'nonexistent', 'user-1', 'resolved')).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe('batchResolveConflicts', () => {
  it('should batch update and log activity when count > 0', async () => {
    mockAssertProjectAccess.mockResolvedValue(undefined);
    mockBatchUpdate.mockResolvedValue(5);

    const result = await batchResolveConflicts(db, 'proj-1', 'user-1', 'resolved');

    expect(result).toEqual({ count: 5 });
    expect(mockLogActivity).toHaveBeenCalled();
  });

  it('should not log activity when count is 0', async () => {
    mockAssertProjectAccess.mockResolvedValue(undefined);
    mockBatchUpdate.mockResolvedValue(0);

    const result = await batchResolveConflicts(db, 'proj-1', 'user-1', 'dismissed');

    expect(result).toEqual({ count: 0 });
    expect(mockLogActivity).not.toHaveBeenCalled();
  });
});

describe('aiVerifyConflict', () => {
  it('should throw NotFoundError when conflict does not exist', async () => {
    mockFindConflictById.mockResolvedValue(null);

    await expect(aiVerifyConflict(db, 'key', 'model', 'nonexistent', 'user-1')).rejects.toThrow(
      NotFoundError,
    );
  });

  it('should throw ForbiddenError during cooldown period', async () => {
    const recentDate = new Date();
    recentDate.setMinutes(recentDate.getMinutes() - 1); // 1 minute ago (within cooldown)
    const conflict = makeConflict({ aiAnalyzedAt: recentDate.toISOString() });
    mockFindConflictById.mockResolvedValue(conflict);
    mockAssertProjectAccess.mockResolvedValue(undefined);

    await expect(aiVerifyConflict(db, 'key', 'model', 'conflict-1', 'user-1')).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('should throw AppError when linked session is missing', async () => {
    const conflict = makeConflict({ aiAnalyzedAt: null });
    mockFindConflictById.mockResolvedValue(conflict);
    mockAssertProjectAccess.mockResolvedValue(undefined);
    mockFindSessionById.mockResolvedValue(null);

    await expect(aiVerifyConflict(db, 'key', 'model', 'conflict-1', 'user-1')).rejects.toThrow(
      AppError,
    );
  });

  it('should analyze conflict and update AI analysis', async () => {
    const conflict = makeConflict({ aiAnalyzedAt: null });
    const sessionA = makeSession({ id: 'sess-a' });
    const sessionB = makeSession({ id: 'sess-b' });
    const analysis = { verdict: 'true_conflict', confidence: 0.9, summary: 'Real conflict' };
    const updated = makeConflict({ aiVerdict: 'true_conflict' });

    mockFindConflictById.mockResolvedValue(conflict);
    mockAssertProjectAccess.mockResolvedValue(undefined);
    mockFindSessionById.mockResolvedValueOnce(sessionA).mockResolvedValueOnce(sessionB);
    mockFindMessages.mockResolvedValue([]);
    mockAnalyzeConflict.mockResolvedValue(analysis);
    mockUpdateAiAnalysis.mockResolvedValue(updated);

    const result = await aiVerifyConflict(db, 'key', 'model', 'conflict-1', 'user-1');

    expect(result.aiVerdict).toBe('true_conflict');
    expect(mockAnalyzeConflict).toHaveBeenCalled();
  });
});

describe('assignReviewer', () => {
  it('should assign reviewer after access check', async () => {
    const conflict = makeConflict();
    const updated = makeConflict({ reviewerId: 'reviewer-1' });
    mockFindConflictById.mockResolvedValue(conflict);
    mockAssertProjectAccess.mockResolvedValue(undefined);
    mockAssignReviewer.mockResolvedValue(updated);

    const result = await assignReviewer(db, 'conflict-1', 'user-1', 'reviewer-1');

    expect(result.reviewerId).toBe('reviewer-1');
  });

  it('should throw NotFoundError when conflict does not exist', async () => {
    mockFindConflictById.mockResolvedValue(null);

    await expect(assignReviewer(db, 'nonexistent', 'user-1', 'reviewer-1')).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe('addReviewNotes', () => {
  it('should update review notes after access check', async () => {
    const conflict = makeConflict();
    const updated = makeConflict({ reviewNotes: 'Some notes' });
    mockFindConflictById.mockResolvedValue(conflict);
    mockAssertProjectAccess.mockResolvedValue(undefined);
    mockUpdateReviewNotes.mockResolvedValue(updated);

    const result = await addReviewNotes(db, 'conflict-1', 'user-1', 'Some notes');

    expect(result.reviewNotes).toBe('Some notes');
  });

  it('should throw NotFoundError when conflict does not exist', async () => {
    mockFindConflictById.mockResolvedValue(null);

    await expect(addReviewNotes(db, 'nonexistent', 'user-1', 'notes')).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe('getConflictOverview', () => {
  it('should return AI overview when conflicts exist', async () => {
    const overview = { summary: 'Overview', recommendations: [] };
    mockAssertProjectAccess.mockResolvedValue(undefined);
    mockFindConflictsByProject.mockResolvedValue({ conflicts: [makeConflict()], total: 1 });
    mockAnalyzeOverview.mockResolvedValue(overview);

    const result = await getConflictOverview(db, 'key', 'model', 'proj-1', 'user-1');

    expect(result).toEqual(overview);
  });

  it('should throw AppError when no conflicts to analyze', async () => {
    mockAssertProjectAccess.mockResolvedValue(undefined);
    mockFindConflictsByProject.mockResolvedValue({ conflicts: [], total: 0 });

    await expect(getConflictOverview(db, 'key', 'model', 'proj-1', 'user-1')).rejects.toThrow(
      AppError,
    );
  });
});
