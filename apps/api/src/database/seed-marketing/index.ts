import { db } from './helpers.js';
import {
  seedUsers,
  seedProject,
  seedDesignSystemProject,
  seedCollaborators,
  seedDesignSystemCollaborators,
} from './seed-users.js';
import { seedSessions } from './seed-sessions.js';
import { seedConflicts } from './seed-conflicts.js';
import { seedPrd } from './seed-prd.js';
import { seedAiEvaluation } from './seed-evaluation.js';
import { seedActivityLog } from './seed-activity.js';
import { seedPlans } from './seed-plans.js';

async function main() {
  console.log('🎨 Seeding marketing demo data...\n');

  // 1. Users (6)
  const users = await seedUsers();
  console.log(`  ✓ ${users.length} users created`);

  // 2. Projects (2)
  const project = await seedProject(users[0]!.id);
  console.log(`  ✓ Project "${project.name}" created`);

  const dsProject = await seedDesignSystemProject(users[5]!.id);
  console.log(`  ✓ Project "${dsProject.name}" created`);

  // 3. Collaborators
  await seedCollaborators(project.id, users);
  await seedDesignSystemCollaborators(dsProject.id, users);
  console.log('  ✓ Collaborators added');

  // 4. Sessions + Messages (18)
  const sessions = await seedSessions(project.id, users);
  console.log(`  ✓ ${sessions.length} sessions created`);

  // 5. Conflicts (8)
  await seedConflicts(project.id, sessions, users);
  console.log('  ✓ 8 conflicts created');

  // 6. PRD data (10 analyses)
  await seedPrd(project.id, users[0]!.id);
  console.log('  ✓ PRD analysis data created (10 analyses, 16 requirements)');

  // 7. AI evaluation (4 users)
  await seedAiEvaluation(project.id, sessions, users);
  console.log('  ✓ AI evaluation data created (4 evaluations)');

  // 8. Activity log (15 entries)
  await seedActivityLog(project.id, users, sessions);
  console.log('  ✓ Activity log entries created');

  // 9. Plans (local files)
  await seedPlans();
  console.log('  ✓ Plan files created in ~/.claude/plans/');

  await db.destroy();
  console.log('\n✅ Marketing seed completed');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
