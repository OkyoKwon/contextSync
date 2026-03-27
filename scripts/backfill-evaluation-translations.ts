/**
 * One-off script to backfill EN/KO translations for existing AI evaluations.
 *
 * Usage:
 *   cd apps/api && npx tsx --env-file=.env ../../scripts/backfill-evaluation-translations.ts
 */

import { createDb } from '../apps/api/src/database/client.js';
import { findEvaluationsNeedingBackfill } from '../apps/api/src/modules/ai-evaluation/ai-evaluation.repository.js';
import { backfillSingleEvaluation } from '../apps/api/src/modules/ai-evaluation/ai-evaluation.service.js';

async function main() {
  const databaseUrl = process.env['DATABASE_URL'];
  const envApiKey = process.env['ANTHROPIC_API_KEY'];
  const model = process.env['ANTHROPIC_MODEL'] ?? 'claude-sonnet-4-20250514';

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
    // Find Crypto-Talk project
    const project = await db
      .selectFrom('projects')
      .select(['id', 'name', 'owner_id'])
      .where('name', 'ilike', '%Crypto%Talk%')
      .executeTakeFirst();

    if (!project) {
      console.error('Crypto-Talk project not found');
      process.exit(1);
    }

    console.log(`Found project: ${project.name} (${project.id})`);

    // Try to get API key from project owner's stored key first
    const owner = await db
      .selectFrom('users')
      .select(['anthropic_api_key'])
      .where('id', '=', project.owner_id as string)
      .executeTakeFirst();

    const apiKey = (owner?.anthropic_api_key as string) ?? envApiKey;
    if (!apiKey) {
      console.error('No ANTHROPIC_API_KEY available (neither in DB nor env)');
      process.exit(1);
    }
    console.log(`Using API key: ${apiKey.slice(0, 15)}...`);

    const evaluationIds = await findEvaluationsNeedingBackfill(db, project.id as string, 50);
    console.log(`Found ${evaluationIds.length} evaluations needing backfill`);

    if (evaluationIds.length === 0) {
      console.log('Nothing to backfill');
      return;
    }

    let processed = 0;
    let failed = 0;

    for (const evalId of evaluationIds) {
      try {
        console.log(`Processing ${evalId}...`);
        await backfillSingleEvaluation(db, apiKey, model, evalId);
        processed++;
        console.log(`  ✓ Done (${processed}/${evaluationIds.length})`);
      } catch (error) {
        failed++;
        console.error(`  ✗ Failed:`, error instanceof Error ? error.message : error);
      }
    }

    console.log(`\nBackfill complete: ${processed} processed, ${failed} failed`);
  } finally {
    await db.destroy();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
