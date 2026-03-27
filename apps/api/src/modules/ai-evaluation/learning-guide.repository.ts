import type { Db } from '../../database/client.js';
import type {
  LearningGuide,
  LearningStep,
  LearningResource,
  LearningResourceType,
  LearningResourceLevel,
  LearningGuideStatus,
} from '@context-sync/shared';

// ── Input types ──

interface CreateGuideInput {
  readonly evaluationGroupId: string;
  readonly targetUserId: string;
  readonly modelUsed: string;
}

interface UpdateGuideInput {
  readonly status?: string;
  readonly currentTierSummary?: string;
  readonly currentTierSummaryKo?: string;
  readonly nextTierGoal?: string;
  readonly nextTierGoalKo?: string;
  readonly priorityAreas?: readonly string[];
  readonly inputTokensUsed?: number;
  readonly outputTokensUsed?: number;
  readonly errorMessage?: string | null;
  readonly completedAt?: Date;
}

interface CreateStepInput {
  readonly stepNumber: number;
  readonly title: string;
  readonly objective: string;
  readonly targetDimensions: readonly string[];
  readonly keyActions: readonly string[];
  readonly practicePrompt: string | null;
  readonly sortOrder: number;
}

interface CreateResourceInput {
  readonly title: string;
  readonly url: string;
  readonly type: string;
  readonly level: string;
  readonly description: string;
  readonly estimatedMinutes: number | null;
  readonly sortOrder: number;
}

// ── CRUD functions ──

export async function createLearningGuide(
  db: Db,
  input: CreateGuideInput,
): Promise<{ readonly id: string }> {
  const row = await db
    .insertInto('ai_evaluation_learning_guides')
    .values({
      evaluation_group_id: input.evaluationGroupId,
      target_user_id: input.targetUserId,
      model_used: input.modelUsed,
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  return { id: row.id };
}

export async function updateLearningGuide(
  db: Db,
  id: string,
  updates: UpdateGuideInput,
): Promise<void> {
  const setValues: Record<string, unknown> = {};

  if (updates.status !== undefined) setValues['status'] = updates.status;
  if (updates.currentTierSummary !== undefined)
    setValues['current_tier_summary'] = updates.currentTierSummary;
  if (updates.currentTierSummaryKo !== undefined)
    setValues['current_tier_summary_ko'] = updates.currentTierSummaryKo;
  if (updates.nextTierGoal !== undefined) setValues['next_tier_goal'] = updates.nextTierGoal;
  if (updates.nextTierGoalKo !== undefined) setValues['next_tier_goal_ko'] = updates.nextTierGoalKo;
  if (updates.priorityAreas !== undefined)
    setValues['priority_areas'] = updates.priorityAreas as string[];
  if (updates.inputTokensUsed !== undefined)
    setValues['input_tokens_used'] = updates.inputTokensUsed;
  if (updates.outputTokensUsed !== undefined)
    setValues['output_tokens_used'] = updates.outputTokensUsed;
  if (updates.errorMessage !== undefined) setValues['error_message'] = updates.errorMessage;
  if (updates.completedAt !== undefined) setValues['completed_at'] = updates.completedAt;

  if (Object.keys(setValues).length === 0) return;

  await db
    .updateTable('ai_evaluation_learning_guides')
    .set(setValues)
    .where('id', '=', id)
    .execute();
}

export async function createLearningSteps(
  db: Db,
  guideId: string,
  steps: readonly CreateStepInput[],
): Promise<readonly string[]> {
  if (steps.length === 0) return [];

  const values = steps.map((s) => ({
    learning_guide_id: guideId,
    step_number: s.stepNumber,
    title: s.title,
    objective: s.objective,
    target_dimensions: s.targetDimensions as string[],
    key_actions: s.keyActions as string[],
    practice_prompt: s.practicePrompt,
    sort_order: s.sortOrder,
  }));

  const rows = await db
    .insertInto('ai_evaluation_learning_steps')
    .values(values)
    .returning('id')
    .execute();

  return rows.map((r) => r.id);
}

export async function createLearningResources(
  db: Db,
  stepId: string,
  resources: readonly CreateResourceInput[],
): Promise<void> {
  if (resources.length === 0) return;

  const values = resources.map((r) => ({
    learning_step_id: stepId,
    title: r.title,
    url: r.url,
    type: r.type,
    level: r.level,
    description: r.description,
    estimated_minutes: r.estimatedMinutes,
    sort_order: r.sortOrder,
  }));

  await db.insertInto('ai_evaluation_learning_resources').values(values).execute();
}

export async function findLearningGuideByGroupId(
  db: Db,
  groupId: string,
): Promise<LearningGuide | null> {
  const guideRow = await db
    .selectFrom('ai_evaluation_learning_guides')
    .selectAll()
    .where('evaluation_group_id', '=', groupId)
    .orderBy('created_at', 'desc')
    .executeTakeFirst();

  if (!guideRow) return null;

  const stepRows = await db
    .selectFrom('ai_evaluation_learning_steps')
    .selectAll()
    .where('learning_guide_id', '=', guideRow.id)
    .orderBy('sort_order', 'asc')
    .execute();

  const stepIds = stepRows.map((s) => s.id);

  const resourceRows =
    stepIds.length > 0
      ? await db
          .selectFrom('ai_evaluation_learning_resources')
          .selectAll()
          .where('learning_step_id', 'in', stepIds)
          .orderBy('sort_order', 'asc')
          .execute()
      : [];

  const resourcesByStep = new Map<string, LearningResource[]>();
  for (const r of resourceRows) {
    const list = resourcesByStep.get(r.learning_step_id) ?? [];
    list.push(toResource(r));
    resourcesByStep.set(r.learning_step_id, list);
  }

  const steps: LearningStep[] = stepRows.map((s) => ({
    id: s.id,
    stepNumber: s.step_number,
    title: s.title,
    titleKo: s.title_ko ?? null,
    objective: s.objective,
    objectiveKo: s.objective_ko ?? null,
    targetDimensions: s.target_dimensions ?? [],
    keyActions: s.key_actions ?? [],
    keyActionsKo: s.key_actions_ko ?? null,
    resources: resourcesByStep.get(s.id) ?? [],
    practicePrompt: s.practice_prompt ?? null,
    practicePromptKo: s.practice_prompt_ko ?? null,
    sortOrder: s.sort_order,
  }));

  return toGuide(guideRow, steps);
}

export async function deleteLearningGuidesByGroupId(db: Db, groupId: string): Promise<void> {
  await db
    .deleteFrom('ai_evaluation_learning_guides')
    .where('evaluation_group_id', '=', groupId)
    .execute();
}

export async function failStuckLearningGuides(db: Db): Promise<number> {
  const stuckThreshold = new Date(Date.now() - 10 * 60 * 1000);

  const result = await db
    .updateTable('ai_evaluation_learning_guides')
    .set({ status: 'failed', error_message: 'Timed out after 10 minutes' })
    .where('status', 'in', ['pending', 'generating'])
    .where('created_at', '<', stuckThreshold)
    .executeTakeFirst();

  return Number(result.numUpdatedRows ?? 0);
}

export async function updateStepTranslations(
  db: Db,
  stepId: string,
  translations: {
    readonly titleKo: string;
    readonly objectiveKo: string;
    readonly keyActionsKo: readonly string[];
    readonly practicePromptKo: string | null;
  },
): Promise<void> {
  await db
    .updateTable('ai_evaluation_learning_steps')
    .set({
      title_ko: translations.titleKo,
      objective_ko: translations.objectiveKo,
      key_actions_ko: translations.keyActionsKo as string[],
      practice_prompt_ko: translations.practicePromptKo,
    })
    .where('id', '=', stepId)
    .execute();
}

export async function updateResourceTranslations(
  db: Db,
  stepId: string,
  translations: readonly { readonly titleKo: string; readonly descriptionKo: string }[],
): Promise<void> {
  const resourceRows = await db
    .selectFrom('ai_evaluation_learning_resources')
    .select(['id'])
    .where('learning_step_id', '=', stepId)
    .orderBy('sort_order', 'asc')
    .execute();

  for (let i = 0; i < resourceRows.length; i++) {
    const row = resourceRows[i]!;
    const t = translations[i];
    if (t) {
      await db
        .updateTable('ai_evaluation_learning_resources')
        .set({ title_ko: t.titleKo, description_ko: t.descriptionKo })
        .where('id', '=', row.id)
        .execute();
    }
  }
}

// ── Mapping helpers ──

function toResource(row: Record<string, unknown>): LearningResource {
  return {
    id: row['id'] as string,
    title: row['title'] as string,
    titleKo: (row['title_ko'] as string) ?? null,
    url: row['url'] as string,
    type: row['type'] as LearningResourceType,
    level: row['level'] as LearningResourceLevel,
    description: row['description'] as string,
    descriptionKo: (row['description_ko'] as string) ?? null,
    estimatedMinutes: row['estimated_minutes'] != null ? Number(row['estimated_minutes']) : null,
    sortOrder: Number(row['sort_order'] ?? 0),
  };
}

function toGuide(row: Record<string, unknown>, steps: readonly LearningStep[]): LearningGuide {
  return {
    id: row['id'] as string,
    evaluationGroupId: row['evaluation_group_id'] as string,
    targetUserId: row['target_user_id'] as string,
    status: row['status'] as LearningGuideStatus,
    currentTierSummary: (row['current_tier_summary'] as string) ?? null,
    currentTierSummaryKo: (row['current_tier_summary_ko'] as string) ?? null,
    nextTierGoal: (row['next_tier_goal'] as string) ?? null,
    nextTierGoalKo: (row['next_tier_goal_ko'] as string) ?? null,
    priorityAreas: (row['priority_areas'] as string[]) ?? [],
    steps,
    modelUsed: row['model_used'] as string,
    inputTokensUsed: Number(row['input_tokens_used'] ?? 0),
    outputTokensUsed: Number(row['output_tokens_used'] ?? 0),
    errorMessage: (row['error_message'] as string) ?? null,
    createdAt:
      row['created_at'] instanceof Date
        ? (row['created_at'] as Date).toISOString()
        : String(row['created_at']),
    completedAt:
      row['completed_at'] instanceof Date
        ? (row['completed_at'] as Date).toISOString()
        : ((row['completed_at'] as string) ?? null),
  };
}
