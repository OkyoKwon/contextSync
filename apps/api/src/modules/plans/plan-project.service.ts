import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { PlanProjectAssociation } from '@context-sync/shared';
import type { Db } from '../../database/client.js';

const CLAUDE_PROJECTS_DIR = join(homedir(), '.claude', 'projects');
const PLAN_REF_PATTERN = /\.claude\/plans\/([a-zA-Z0-9_-]+\.md)/g;
const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  readonly data: ReadonlyMap<string, readonly PlanProjectAssociation[]>;
  readonly timestamp: number;
}

let cache: CacheEntry | null = null;

function decodeProjectPath(dirName: string): string {
  return '/' + dirName.slice(1).replace(/-/g, '/');
}

async function scanJsonlFilesForPlanRefs(): Promise<ReadonlyMap<string, readonly string[]>> {
  const planToDirectories = new Map<string, Set<string>>();

  try {
    const projectDirs = await readdir(CLAUDE_PROJECTS_DIR, { withFileTypes: true });

    for (const dir of projectDirs) {
      if (!dir.isDirectory()) continue;

      const dirPath = join(CLAUDE_PROJECTS_DIR, dir.name);
      const decodedPath = decodeProjectPath(dir.name);

      try {
        const files = await readdir(dirPath, { withFileTypes: true });
        const jsonlFiles = files.filter((f) => f.isFile() && f.name.endsWith('.jsonl'));

        for (const file of jsonlFiles) {
          try {
            const content = await readFile(join(dirPath, file.name), 'utf-8');
            let match: RegExpExecArray | null;
            const pattern = new RegExp(PLAN_REF_PATTERN.source, 'g');

            while ((match = pattern.exec(content)) !== null) {
              const planFilename = match[1];
              const existing = planToDirectories.get(planFilename);
              if (existing) {
                existing.add(decodedPath);
              } else {
                planToDirectories.set(planFilename, new Set([decodedPath]));
              }
            }
          } catch {
            // Skip unreadable JSONL files
          }
        }
      } catch {
        // Skip unreadable directories
      }
    }
  } catch {
    // ~/.claude/projects/ may not exist
  }

  const result = new Map<string, readonly string[]>();
  for (const [plan, dirs] of planToDirectories) {
    result.set(plan, [...dirs]);
  }
  return result;
}

interface ProjectRecord {
  readonly id: string;
  readonly name: string;
  readonly local_directory: string;
}

async function fetchProjectDirectoryMap(db: Db): Promise<ReadonlyMap<string, ProjectRecord>> {
  const projects = await db
    .selectFrom('projects')
    .select(['id', 'name', 'local_directory'])
    .where('local_directory', 'is not', null)
    .execute();

  const collaborators = await db
    .selectFrom('project_collaborators')
    .innerJoin('projects', 'projects.id', 'project_collaborators.project_id')
    .select(['projects.id', 'projects.name', 'project_collaborators.local_directory'])
    .where('project_collaborators.local_directory', 'is not', null)
    .execute();

  const map = new Map<string, ProjectRecord>();

  for (const p of projects) {
    if (p.local_directory) {
      map.set(p.local_directory, { id: p.id, name: p.name, local_directory: p.local_directory });
    }
  }

  for (const c of collaborators) {
    if (c.local_directory && !map.has(c.local_directory)) {
      map.set(c.local_directory, { id: c.id, name: c.name, local_directory: c.local_directory });
    }
  }

  return map;
}

export async function getPlanProjectMapping(
  db: Db,
): Promise<ReadonlyMap<string, readonly PlanProjectAssociation[]>> {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return cache.data;
  }

  const [planToDirectories, projectMap] = await Promise.all([
    scanJsonlFilesForPlanRefs(),
    fetchProjectDirectoryMap(db),
  ]);

  const result = new Map<string, readonly PlanProjectAssociation[]>();

  for (const [planFilename, directories] of planToDirectories) {
    const associations: PlanProjectAssociation[] = directories.map((dir) => {
      const project = projectMap.get(dir);
      return {
        projectId: project?.id ?? null,
        projectName: project?.name ?? null,
        projectDirectory: dir,
      };
    });
    result.set(planFilename, associations);
  }

  cache = { data: result, timestamp: now };
  return result;
}
