import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createLearningGuide,
  updateLearningGuide,
  createLearningSteps,
  createLearningResources,
  findLearningGuideByGroupId,
  deleteLearningGuidesByGroupId,
  failStuckLearningGuides,
  updateStepTranslations,
} from '../learning-guide.repository.js';

const now = new Date('2025-01-01T00:00:00.000Z');

function createMockDb() {
  const executeTakeFirst = vi.fn();
  const executeTakeFirstOrThrow = vi.fn();
  const execute = vi.fn().mockResolvedValue([]);

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockReturnValue(chain);
  chain.returningAll = vi.fn().mockReturnValue(chain);
  chain.selectAll = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.executeTakeFirst = executeTakeFirst;
  chain.executeTakeFirstOrThrow = executeTakeFirstOrThrow;
  chain.execute = execute;

  return {
    insertInto: vi.fn().mockReturnValue(chain),
    selectFrom: vi.fn().mockReturnValue(chain),
    updateTable: vi.fn().mockReturnValue(chain),
    deleteFrom: vi.fn().mockReturnValue(chain),
    _chain: chain,
    _executeTakeFirst: executeTakeFirst,
    _executeTakeFirstOrThrow: executeTakeFirstOrThrow,
    _execute: execute,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createLearningGuide', () => {
  it('should insert guide and return id', async () => {
    const db = createMockDb();
    db._executeTakeFirstOrThrow.mockResolvedValue({ id: 'guide-1' });

    const result = await createLearningGuide(db, {
      evaluationGroupId: 'group-1',
      targetUserId: 'user-1',
      modelUsed: 'claude-3',
    });

    expect(result.id).toBe('guide-1');
    expect(db.insertInto).toHaveBeenCalledWith('ai_evaluation_learning_guides');
  });
});

describe('updateLearningGuide', () => {
  it('should update specified fields', async () => {
    const db = createMockDb();

    await updateLearningGuide(db, 'guide-1', { status: 'completed', currentTierSummary: 'Good' });

    expect(db.updateTable).toHaveBeenCalledWith('ai_evaluation_learning_guides');
    expect(db._chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        current_tier_summary: 'Good',
      }),
    );
  });

  it('should skip update when no fields provided', async () => {
    const db = createMockDb();

    await updateLearningGuide(db, 'guide-1', {});

    expect(db.updateTable).not.toHaveBeenCalled();
  });
});

describe('createLearningSteps', () => {
  it('should return empty array for empty steps', async () => {
    const db = createMockDb();
    const result = await createLearningSteps(db, 'guide-1', []);
    expect(result).toEqual([]);
  });

  it('should insert steps and return ids', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValue([{ id: 'step-1' }, { id: 'step-2' }]);

    const result = await createLearningSteps(db, 'guide-1', [
      {
        stepNumber: 1,
        title: 'Step 1',
        objective: 'Obj 1',
        targetDimensions: ['dim1'],
        keyActions: ['action1'],
        practicePrompt: null,
        sortOrder: 0,
      },
      {
        stepNumber: 2,
        title: 'Step 2',
        objective: 'Obj 2',
        targetDimensions: ['dim2'],
        keyActions: ['action2'],
        practicePrompt: 'Try this',
        sortOrder: 1,
      },
    ]);

    expect(result).toEqual(['step-1', 'step-2']);
  });
});

describe('createLearningResources', () => {
  it('should skip for empty resources', async () => {
    const db = createMockDb();
    await createLearningResources(db, 'step-1', []);
    expect(db.insertInto).not.toHaveBeenCalled();
  });

  it('should insert resources', async () => {
    const db = createMockDb();

    await createLearningResources(db, 'step-1', [
      {
        title: 'Resource',
        url: 'https://example.com',
        type: 'article',
        level: 'beginner',
        description: 'Desc',
        estimatedMinutes: 10,
        sortOrder: 0,
      },
    ]);

    expect(db.insertInto).toHaveBeenCalledWith('ai_evaluation_learning_resources');
  });
});

describe('findLearningGuideByGroupId', () => {
  it('should return null when guide not found', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await findLearningGuideByGroupId(db, 'nonexistent');
    expect(result).toBeNull();
  });

  it('should return guide with steps and resources', async () => {
    const db = createMockDb();
    // Guide row
    db._executeTakeFirst.mockResolvedValue({
      id: 'guide-1',
      evaluation_group_id: 'group-1',
      target_user_id: 'user-1',
      status: 'completed',
      current_tier_summary: 'Good',
      current_tier_summary_ko: null,
      next_tier_goal: 'Better',
      next_tier_goal_ko: null,
      priority_areas: ['area1'],
      model_used: 'claude-3',
      input_tokens_used: 100,
      output_tokens_used: 200,
      error_message: null,
      created_at: now,
      completed_at: now,
    });
    // Steps
    db._execute.mockResolvedValueOnce([
      {
        id: 'step-1',
        step_number: 1,
        title: 'Step 1',
        title_ko: null,
        objective: 'Obj',
        objective_ko: null,
        target_dimensions: ['dim1'],
        key_actions: ['act1'],
        key_actions_ko: null,
        practice_prompt: null,
        practice_prompt_ko: null,
        sort_order: 0,
        learning_guide_id: 'guide-1',
      },
    ]);
    // Resources
    db._execute.mockResolvedValueOnce([
      {
        id: 'res-1',
        learning_step_id: 'step-1',
        title: 'Resource',
        title_ko: null,
        url: 'https://ex.com',
        type: 'article',
        level: 'beginner',
        description: 'Desc',
        description_ko: null,
        estimated_minutes: 5,
        sort_order: 0,
      },
    ]);

    const result = await findLearningGuideByGroupId(db, 'group-1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('guide-1');
    expect(result!.steps).toHaveLength(1);
    expect(result!.steps[0]!.resources).toHaveLength(1);
  });
});

describe('deleteLearningGuidesByGroupId', () => {
  it('should delete guides by group id', async () => {
    const db = createMockDb();
    await deleteLearningGuidesByGroupId(db, 'group-1');
    expect(db.deleteFrom).toHaveBeenCalledWith('ai_evaluation_learning_guides');
  });
});

describe('failStuckLearningGuides', () => {
  it('should return count of updated rows', async () => {
    const db = createMockDb();
    db._executeTakeFirst.mockResolvedValue({ numUpdatedRows: BigInt(3) });

    const result = await failStuckLearningGuides(db);
    expect(result).toBe(3);
  });
});

describe('updateStepTranslations', () => {
  it('should update translation fields', async () => {
    const db = createMockDb();
    await updateStepTranslations(db, 'step-1', {
      titleKo: '단계 1',
      objectiveKo: '목표',
      keyActionsKo: ['행동1'],
      practicePromptKo: null,
    });

    expect(db.updateTable).toHaveBeenCalledWith('ai_evaluation_learning_steps');
    expect(db._chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        title_ko: '단계 1',
        objective_ko: '목표',
      }),
    );
  });
});
