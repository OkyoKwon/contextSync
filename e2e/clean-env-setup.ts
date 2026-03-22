import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

function run(cmd: string, cwd: string): void {
  console.log(`[clean-env-setup] Running: ${cmd}`);
  const output = execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  if (output) console.log(output);
}

async function cleanEnvSetup(): Promise<void> {
  // Resolve project root from cwd (Playwright runs from project root)
  const projectRoot = process.cwd();
  const composeFile = resolve(projectRoot, 'docker-compose.test.yml');

  console.log(`[clean-env-setup] cwd=${projectRoot}, compose=${composeFile}`);

  run(`docker compose -f "${composeFile}" down -v`, projectRoot);
  run(`docker compose -f "${composeFile}" up -d --wait`, projectRoot);

  console.log('[clean-env-setup] Postgres is ready.');
}

export default cleanEnvSetup;
