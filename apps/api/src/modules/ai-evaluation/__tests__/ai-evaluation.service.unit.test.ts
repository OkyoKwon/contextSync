import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../projects/project.service.js', () => ({
  assertProjectAccess: vi.fn(),
  getUserRoleInProject: vi.fn(),
}));

vi.mock('../ai-evaluation.repository.js', () => ({
  findPendingOrAnalyzingGroup: vi.fn(),
  findUserMessagesForEvaluation: vi.fn(),
  createEvaluationGroup: vi.fn(),
  createEvaluation: vi.fn(),
  updateEvaluationGroupStatus: vi.fn(),
  updateEvaluation: vi.fn(),
  findEvaluationGroupById: vi.fn(),
  findEvaluationsByGroupId: vi.fn(),
  findEvaluationGroupsByProjectAndUser: vi.fn(),
  findEvaluationGroupByIdWithDetails: vi.fn(),
  findTeamEvaluationSummary: vi.fn(),
  findLatestEvaluationWithDetails: vi.fn(),
  findEvaluationById: vi.fn(),
  findEvaluationHistory: vi.fn(),
  findEvaluationGroupHistory: vi.fn(),
  findLatestEvaluationGroup: vi.fn(),
  findEvaluationGroup: vi.fn(),
  deleteEvaluationGroup: vi.fn(),
  failStuckEvaluations: vi.fn(),
  findEvaluationsNeedingBackfill: vi.fn(),
  createDimensions: vi.fn(),
  createEvidence: vi.fn(),
}));

vi.mock('../claude-client.js', () => ({
  analyzeEvaluation: vi.fn(),
}));

vi.mock('../translate-evaluation.js', () => ({
  translateEvaluationToKorean: vi.fn((text: any) => text),
  translateStoredEvaluationToKorean: vi.fn((data: any) => data),
  translateStoredEvaluationToEnglish: vi.fn((data: any) => data),
}));

vi.mock('../learning-guide.service.js', () => ({
  generateLearningGuide: vi.fn(),
}));

vi.mock('../learning-guide.repository.js', () => ({
  deleteLearningGuidesByGroupId: vi.fn(),
}));

import { assertProjectAccess, getUserRoleInProject } from '../../projects/project.service.js';
import * as evalRepo from '../ai-evaluation.repository.js';
import {
  triggerEvaluation,
  getLatestEvaluation,
  getEvaluationDetail,
  getEvaluationHistory,
  getEvaluationGroupHistory,
  getTeamSummary,
  deleteEvaluationGroup,
} from '../ai-evaluation.service.js';
import { deleteLearningGuidesByGroupId } from '../learning-guide.repository.js';
import { ForbiddenError, NotFoundError } from '../../../plugins/error-handler.plugin.js';

const mockAssertAccess = vi.mocked(assertProjectAccess);
const mockGetRole = vi.mocked(getUserRoleInProject);
const mockFindPending = vi.mocked(evalRepo.findPendingOrAnalyzingGroup);
const mockFindMessages = vi.mocked(evalRepo.findUserMessagesForEvaluation);
const mockFindLatest = vi.mocked(evalRepo.findLatestEvaluationWithDetails);
const mockFindById = vi.mocked(evalRepo.findEvaluationById);
const mockFindHistory = vi.mocked(evalRepo.findEvaluationHistory);
const mockFindGroupHistory = vi.mocked(evalRepo.findEvaluationGroupHistory);
const mockFindTeamSummary = vi.mocked(evalRepo.findTeamEvaluationSummary);
const mockFindGroup = vi.mocked(evalRepo.findEvaluationGroup);
const mockDeleteGroup = vi.mocked(evalRepo.deleteEvaluationGroup);
const mockDeleteGuides = vi.mocked(deleteLearningGuidesByGroupId);

const db = {} as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertAccess.mockResolvedValue(undefined);
});

describe('triggerEvaluation', () => {
  it('should throw ForbiddenError when evaluation already in progress', async () => {
    mockFindPending.mockResolvedValue({ id: 'group-1' } as any);

    await expect(
      triggerEvaluation(db, 'api-key', 'model', 'proj-1', 'user-1', {
        targetUserId: 'user-2',
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(mockFindPending).toHaveBeenCalledWith(db, 'proj-1', 'user-2');
  });

  it('should throw ForbiddenError when insufficient messages', async () => {
    mockFindPending.mockResolvedValue(null);
    mockFindMessages.mockResolvedValue({
      messages: [{ id: 'm1', sessionId: 's1', content: 'hello', createdAt: '2025-01-01' }],
      sessionCount: 1,
    });

    await expect(
      triggerEvaluation(db, 'api-key', 'model', 'proj-1', 'user-1', {
        targetUserId: 'user-2',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should check project access before evaluation', async () => {
    mockAssertAccess.mockRejectedValue(new ForbiddenError());

    await expect(
      triggerEvaluation(db, 'api-key', 'model', 'proj-1', 'user-1', {
        targetUserId: 'user-2',
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(mockAssertAccess).toHaveBeenCalledWith(db, 'proj-1', 'user-1');
  });
});

describe('getLatestEvaluation', () => {
  it('should return latest evaluation after access check', async () => {
    const mockEval = { id: 'eval-1', targetUserId: 'user-1' } as any;
    mockFindLatest.mockResolvedValue(mockEval);

    const result = await getLatestEvaluation(db, 'proj-1', 'user-1', 'user-1');

    expect(result).toEqual(mockEval);
    expect(mockAssertAccess).toHaveBeenCalledWith(db, 'proj-1', 'user-1');
  });

  it('should return null when no evaluation exists', async () => {
    mockFindLatest.mockResolvedValue(null);

    const result = await getLatestEvaluation(db, 'proj-1', 'user-1', 'user-1');

    expect(result).toBeNull();
  });
});

describe('getEvaluationDetail', () => {
  it('should return evaluation detail', async () => {
    const mockEval = { id: 'eval-1', projectId: 'proj-1', targetUserId: 'user-1' } as any;
    mockFindById.mockResolvedValue(mockEval);

    const result = await getEvaluationDetail(db, 'proj-1', 'eval-1', 'user-1');

    expect(result).toEqual(mockEval);
  });

  it('should throw NotFoundError when evaluation not found', async () => {
    mockFindById.mockResolvedValue(null);

    await expect(getEvaluationDetail(db, 'proj-1', 'eval-1', 'user-1')).rejects.toThrow(
      NotFoundError,
    );
  });

  it('should throw ForbiddenError when evaluation belongs to different project', async () => {
    const mockEval = { id: 'eval-1', projectId: 'proj-2', targetUserId: 'user-1' } as any;
    mockFindById.mockResolvedValue(mockEval);

    await expect(getEvaluationDetail(db, 'proj-1', 'eval-1', 'user-1')).rejects.toThrow(
      ForbiddenError,
    );
  });
});

describe('getEvaluationHistory', () => {
  it('should return evaluation history', async () => {
    const history = { entries: [], total: 0 };
    mockFindHistory.mockResolvedValue(history);

    const result = await getEvaluationHistory(db, 'proj-1', 'user-1', 'user-1', 1, 20);

    expect(result).toEqual(history);
    expect(mockFindHistory).toHaveBeenCalledWith(db, 'proj-1', 'user-1', 1, 20);
  });
});

describe('getEvaluationGroupHistory', () => {
  it('should return group history', async () => {
    const history = { entries: [], total: 0 };
    mockFindGroupHistory.mockResolvedValue(history);

    const result = await getEvaluationGroupHistory(db, 'proj-1', 'user-1', 'user-1', 1, 10);

    expect(result).toEqual(history);
  });
});

describe('getTeamSummary', () => {
  it('should return team summary for owner', async () => {
    mockGetRole.mockResolvedValue('owner');
    mockFindTeamSummary.mockResolvedValue([]);

    const result = await getTeamSummary(db, 'proj-1', 'user-1');

    expect(result).toEqual([]);
  });

  it('should throw ForbiddenError for non-owner', async () => {
    mockGetRole.mockResolvedValue('collaborator');

    await expect(getTeamSummary(db, 'proj-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});

describe('deleteEvaluationGroup', () => {
  it('should delete group and learning guides', async () => {
    mockFindGroup.mockResolvedValue({ claude: null, chatgpt: null, gemini: null } as any);
    mockDeleteGuides.mockResolvedValue(undefined);
    mockDeleteGroup.mockResolvedValue(undefined);

    await deleteEvaluationGroup(db, 'proj-1', 'group-1', 'user-1');

    expect(mockDeleteGuides).toHaveBeenCalledWith(db, 'group-1');
    expect(mockDeleteGroup).toHaveBeenCalledWith(db, 'group-1');
  });

  it('should throw NotFoundError when group not found', async () => {
    mockFindGroup.mockResolvedValue(null);

    await expect(deleteEvaluationGroup(db, 'proj-1', 'group-1', 'user-1')).rejects.toThrow(
      NotFoundError,
    );
  });
});
