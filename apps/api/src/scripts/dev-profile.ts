import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const API_DIR = path.resolve(import.meta.dirname, '../..');
const WEB_DIR = path.resolve(API_DIR, '../web');

function readProfileEnv(profileName: string): {
  readonly apiPort: string;
  readonly webPort: string;
} {
  const envPath = path.join(API_DIR, `.env.${profileName}`);
  if (!fs.existsSync(envPath)) {
    console.error(`Profile not found: apps/api/.env.${profileName}`);
    console.error('Run "pnpm setup:team --profile <name>" to create one.');
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const portMatch = content.match(/^PORT=(\d+)/m);
  const vitePortMatch = content.match(/^VITE_PORT=(\d+)/m);

  if (!portMatch || !vitePortMatch) {
    console.error(`Invalid profile env file: missing PORT or VITE_PORT in .env.${profileName}`);
    process.exit(1);
  }

  return { apiPort: portMatch[1] as string, webPort: vitePortMatch[1] as string };
}

function main() {
  const profileName = process.argv.slice(2).find((arg) => arg !== '--');
  if (!profileName) {
    console.error('Usage: pnpm dev:profile <profile-name>');
    console.error('');
    const profiles = fs
      .readdirSync(API_DIR)
      .filter((f) => f.startsWith('.env.') && f !== '.env.example')
      .map((f) => f.replace('.env.', ''));
    if (profiles.length > 0) {
      console.error('Available profiles:');
      for (const p of profiles) {
        console.error(`  - ${p}`);
      }
    } else {
      console.error('No profiles found. Run "pnpm setup:team" to create one.');
    }
    process.exit(1);
  }

  const { apiPort, webPort } = readProfileEnv(profileName);

  console.log(`Starting profile: ${profileName}`);
  console.log(`  API  -> http://localhost:${apiPort}`);
  console.log(`  Web  -> http://localhost:${webPort}`);
  console.log('');

  const children: ChildProcess[] = [];

  const api = spawn(
    'npx',
    ['tsx', 'watch', `--env-file-if-exists=.env.${profileName}`, 'src/index.ts'],
    {
      cwd: API_DIR,
      stdio: 'inherit',
      env: { ...process.env },
    },
  );
  children.push(api);

  const web = spawn('npx', ['vite'], {
    cwd: WEB_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_PORT: webPort,
      VITE_API_TARGET: `http://localhost:${apiPort}`,
    },
  });
  children.push(web);

  const cleanup = () => {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    }
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  api.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`API process exited with code ${code}`);
    }
    cleanup();
  });

  web.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`Web process exited with code ${code}`);
    }
    cleanup();
  });
}

main();
