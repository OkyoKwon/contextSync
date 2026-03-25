// Use timestamp + random suffix to avoid collisions between parallel workers
let counter = 0;
const workerId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function nextId(): string {
  counter += 1;
  return `${workerId}-${counter}`;
}

export function resetCounter(): void {
  counter = 0;
}

export function buildUser(overrides?: { name?: string }): {
  readonly name: string;
} {
  const id = nextId();
  return {
    name: overrides?.name ?? `Test User ${id}`,
  };
}

export function buildProject(overrides?: { name?: string; description?: string }): {
  readonly name: string;
  readonly description: string;
} {
  const id = nextId();
  return {
    name: overrides?.name ?? `E2E Project ${id}`,
    description: overrides?.description ?? `Test project created by E2E suite (${id})`,
  };
}

export function buildSession(overrides?: {
  title?: string;
  source?: string;
  status?: string;
  filePaths?: string[];
  tags?: string[];
  branch?: string;
}): {
  readonly title: string;
  readonly source: string;
  readonly status: string;
  readonly filePaths: string[];
  readonly tags: string[];
  readonly branch: string;
} {
  const id = nextId();
  return {
    title: overrides?.title ?? `E2E Session ${id}`,
    source: overrides?.source ?? 'claude-code',
    status: overrides?.status ?? 'active',
    filePaths: overrides?.filePaths ?? [`src/feature-${id}.ts`],
    tags: overrides?.tags ?? [`e2e-${id}`],
    branch: overrides?.branch ?? `feature/e2e-${id}`,
  };
}
