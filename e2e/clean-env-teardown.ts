import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COMPOSE_FILE = resolve(PROJECT_ROOT, 'docker-compose.test.yml');

async function cleanEnvTeardown(): Promise<void> {
  console.log('[clean-env-teardown] Stopping clean-env containers and removing volumes...');
  execSync(`docker compose -f ${COMPOSE_FILE} down -v`, {
    stdio: 'inherit',
    cwd: PROJECT_ROOT,
  });
  console.log('[clean-env-teardown] Clean-env stack removed.');
}

export default cleanEnvTeardown;
