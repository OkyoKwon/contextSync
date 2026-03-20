import { readdir, readFile, stat, unlink } from 'node:fs/promises';
import { join, normalize } from 'node:path';
import { homedir } from 'node:os';
import type { PlanSummary, PlanDetail } from '@context-sync/shared';
import type { Db } from '../../database/client.js';
import { getPlanProjectMapping } from './plan-project.service.js';

const CLAUDE_PLANS_DIR = join(homedir(), '.claude', 'plans');

const FILENAME_PATTERN = /^[a-zA-Z0-9_-]+\.md$/;

function validateFilename(filename: string): string {
  if (!FILENAME_PATTERN.test(filename)) {
    throw Object.assign(new Error('Invalid plan filename'), { statusCode: 400 });
  }

  const safePath = normalize(join(CLAUDE_PLANS_DIR, filename));
  if (!safePath.startsWith(CLAUDE_PLANS_DIR)) {
    throw Object.assign(new Error('Invalid plan filename'), { statusCode: 400 });
  }

  return safePath;
}

function extractTitle(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.slice(2).trim();
    }
  }
  return 'Untitled';
}

export async function listPlans(db: Db): Promise<readonly PlanSummary[]> {
  try {
    const [entries, projectMapping] = await Promise.all([
      readdir(CLAUDE_PLANS_DIR, { withFileTypes: true }),
      getPlanProjectMapping(db),
    ]);
    const plans: PlanSummary[] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

      try {
        const fullPath = join(CLAUDE_PLANS_DIR, entry.name);
        const [fileStat, content] = await Promise.all([
          stat(fullPath),
          readFile(fullPath, 'utf-8'),
        ]);

        plans.push({
          filename: entry.name,
          title: extractTitle(content),
          sizeBytes: fileStat.size,
          lastModifiedAt: new Date(fileStat.mtimeMs).toISOString(),
          projects: projectMapping.get(entry.name) ?? [],
        });
      } catch {
        // Skip files we can't read/stat
      }
    }

    plans.sort((a, b) => (b.lastModifiedAt > a.lastModifiedAt ? 1 : -1));

    return plans;
  } catch {
    return [];
  }
}

export async function getPlanDetail(db: Db, filename: string): Promise<PlanDetail> {
  const fullPath = validateFilename(filename);

  try {
    const [fileStat, content, projectMapping] = await Promise.all([
      stat(fullPath),
      readFile(fullPath, 'utf-8'),
      getPlanProjectMapping(db),
    ]);

    return {
      filename,
      title: extractTitle(content),
      content,
      sizeBytes: fileStat.size,
      lastModifiedAt: new Date(fileStat.mtimeMs).toISOString(),
      projects: projectMapping.get(filename) ?? [],
    };
  } catch {
    throw Object.assign(new Error(`Plan not found: ${filename}`), { statusCode: 404 });
  }
}

export async function deletePlan(filename: string): Promise<void> {
  const fullPath = validateFilename(filename);

  try {
    await unlink(fullPath);
  } catch {
    throw Object.assign(new Error(`Plan not found: ${filename}`), { statusCode: 404 });
  }
}
