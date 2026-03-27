/**
 * One-off script to boost Okyo's AI evaluation scores by +10 points (capped at 100).
 *
 * Usage:
 *   cd apps/api && npx tsx --env-file=.env ../../scripts/boost-evaluation-scores.ts
 */

import { sql } from 'kysely';
import { createDb } from '../apps/api/src/database/client.js';

const BOOST = 10;

const PERSPECTIVE_TIER_RANGES: Record<string, Record<string, { min: number; max: number }>> = {
  claude: {
    novice: { min: 0, max: 25 },
    developing: { min: 26, max: 50 },
    proficient: { min: 51, max: 70 },
    advanced: { min: 71, max: 85 },
    expert: { min: 86, max: 100 },
  },
  chatgpt: {
    beginner: { min: 0, max: 25 },
    intermediate: { min: 26, max: 50 },
    advanced: { min: 51, max: 75 },
    expert: { min: 76, max: 100 },
  },
  gemini: {
    awareness: { min: 0, max: 20 },
    user: { min: 21, max: 40 },
    advanced: { min: 41, max: 60 },
    strategist: { min: 61, max: 80 },
    innovator: { min: 81, max: 100 },
  },
  '4d_framework': {
    foundational: { min: 0, max: 25 },
    developing: { min: 26, max: 50 },
    proficient: { min: 51, max: 70 },
    advanced: { min: 71, max: 85 },
    fluent: { min: 86, max: 100 },
  },
};

function getTierForScore(perspective: string, score: number): string {
  const ranges = PERSPECTIVE_TIER_RANGES[perspective] ?? PERSPECTIVE_TIER_RANGES['claude'];
  for (const [tier, range] of Object.entries(ranges)) {
    if (score >= range.min && score <= range.max) {
      return tier;
    }
  }
  return 'novice';
}

function cap(value: number | null, boost: number): number | null {
  if (value === null) return null;
  return Math.min(Number(value) + boost, 100);
}

async function main() {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const db = createDb({
    connectionString: databaseUrl,
    ssl: process.env['DATABASE_SSL'] === 'true',
    sslCaPath: process.env['DATABASE_SSL_CA'],
  });

  try {
    // Find Okyo user
    const user = await db
      .selectFrom('users')
      .select(['id', 'name'])
      .where('name', '=', 'Okyo')
      .executeTakeFirst();

    if (!user) {
      console.error('User "Okyo" not found');
      process.exit(1);
    }
    console.log(`Found user: ${user.name} (${user.id})`);

    // Find Crypto-Talk project
    const project = await db
      .selectFrom('projects')
      .select(['id', 'name'])
      .where('name', 'ilike', '%Crypto%Talk%')
      .executeTakeFirst();

    if (!project) {
      console.error('ContextSyncDev project not found');
      process.exit(1);
    }
    console.log(`Found project: ${project.name} (${project.id})`);

    // Fetch completed evaluations for Okyo
    const evaluations = await db
      .selectFrom('ai_evaluations')
      .select([
        'id',
        'perspective',
        'overall_score',
        'prompt_quality_score',
        'task_complexity_score',
        'iteration_pattern_score',
        'context_utilization_score',
        'ai_capability_leverage_score',
        'proficiency_tier',
      ])
      .where('project_id', '=', project.id as string)
      .where('target_user_id', '=', user.id as string)
      .where('status', '=', 'completed')
      .execute();

    console.log(`Found ${evaluations.length} completed evaluations\n`);

    if (evaluations.length === 0) {
      console.log('Nothing to update');
      return;
    }

    let updated = 0;

    for (const evaluation of evaluations) {
      const newOverall = cap(evaluation.overall_score, BOOST);
      const newTier =
        newOverall !== null
          ? getTierForScore(evaluation.perspective as string, newOverall)
          : evaluation.proficiency_tier;

      console.log(
        `[${evaluation.perspective}] ${evaluation.id.slice(0, 8)}... ` +
          `overall: ${evaluation.overall_score} → ${newOverall}, ` +
          `tier: ${evaluation.proficiency_tier} → ${newTier}`,
      );

      // Update ai_evaluations main scores
      await db
        .updateTable('ai_evaluations')
        .set({
          overall_score: newOverall,
          prompt_quality_score: cap(evaluation.prompt_quality_score, BOOST),
          task_complexity_score: cap(evaluation.task_complexity_score, BOOST),
          iteration_pattern_score: cap(evaluation.iteration_pattern_score, BOOST),
          context_utilization_score: cap(evaluation.context_utilization_score, BOOST),
          ai_capability_leverage_score: cap(evaluation.ai_capability_leverage_score, BOOST),
          proficiency_tier: newTier,
        })
        .where('id', '=', evaluation.id as string)
        .execute();

      // Update ai_evaluation_dimensions scores (cap at 100)
      const dimResult = await db
        .updateTable('ai_evaluation_dimensions')
        .set({
          score: sql`LEAST(score + ${BOOST}, 100)`,
        } as any)
        .where('evaluation_id', '=', evaluation.id as string)
        .execute();

      const dimCount = dimResult[0]?.numUpdatedRows ?? 0n;
      console.log(`  → ${dimCount} dimensions updated`);
      updated++;
    }

    console.log(`\nDone: ${updated} evaluations boosted by +${BOOST} points`);
  } finally {
    await db.destroy();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
