import { db } from './helpers.js';
import { seedUsers, seedProject, seedCollaborators } from './seed-users.js';
import { seedSessions } from './seed-sessions.js';
import { seedConflicts } from './seed-conflicts.js';
import { seedPrd } from './seed-prd.js';
import { seedAiEvaluation } from './seed-evaluation.js';
import { seedActivityLog } from './seed-activity.js';

async function main() {
  console.log('🎨 Seeding marketing demo data...\n');

  // 1. Users
  const users = await seedUsers();
  console.log(`  ✓ ${users.length} users created`);

  // 2. Project
  const project = await seedProject(users[0]!.id);
  console.log(`  ✓ Project "${project.name}" created`);

  // 3. Collaborators
  await seedCollaborators(project.id, users);
  console.log('  ✓ Collaborators added');

  // 4. Sessions + Messages
  const sessions = await seedSessions(project.id, users);
  console.log(`  ✓ ${sessions.length} sessions created`);

  // 5. Conflicts
  await seedConflicts(project.id, sessions, users);
  console.log('  ✓ 4 conflicts created');

  // 6. PRD data
  await seedPrd(project.id, users[0]!.id);
  console.log('  ✓ PRD analysis data created');

  // 7. AI evaluation
  await seedAiEvaluation(project.id, users[0]!.id, sessions);
  console.log('  ✓ AI evaluation data created');

  // 8. Activity log
  await seedActivityLog(project.id, users, sessions);
  console.log('  ✓ Activity log entries created');

  await db.destroy();
  console.log('\n✅ Marketing seed completed');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
