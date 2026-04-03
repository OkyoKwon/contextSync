import { readdir, readFile, stat, access } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir, platform } from 'node:os';

export interface DesktopSessionMetadata {
  readonly sessionId: string;
  readonly title: string;
  readonly model: string;
  readonly userSelectedFolders: readonly string[];
  readonly createdAt: number;
  readonly lastActivityAt: number;
}

export interface DesktopSessionFile {
  readonly sessionId: string;
  readonly auditLogPath: string;
  readonly metadataPath: string;
  readonly lastModifiedMs: number;
  readonly metadata: DesktopSessionMetadata;
}

/**
 * Returns the Desktop App local-agent-mode-sessions base path for the current platform.
 * Currently only macOS is supported.
 */
export function getDesktopBasePath(): string | null {
  if (platform() !== 'darwin') return null;
  return join(homedir(), 'Library', 'Application Support', 'Claude', 'local-agent-mode-sessions');
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function readMetadataFile(metadataPath: string): Promise<DesktopSessionMetadata | null> {
  try {
    const content = await readFile(metadataPath, 'utf-8');
    const data = JSON.parse(content) as Record<string, unknown>;

    const sessionId = data['sessionId'];
    if (typeof sessionId !== 'string') return null;

    return {
      sessionId,
      title: typeof data['title'] === 'string' ? data['title'] : '',
      model: typeof data['model'] === 'string' ? data['model'] : '',
      userSelectedFolders: Array.isArray(data['userSelectedFolders'])
        ? (data['userSelectedFolders'] as readonly string[]).filter(
            (f): f is string => typeof f === 'string',
          )
        : [],
      createdAt: typeof data['createdAt'] === 'number' ? data['createdAt'] : 0,
      lastActivityAt: typeof data['lastActivityAt'] === 'number' ? data['lastActivityAt'] : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Scan a single space directory for Desktop sessions.
 * Structure: {spaceDir}/local_{uuid}.json + local_{uuid}/audit.jsonl
 */
async function scanSpaceDirectory(spaceDir: string): Promise<readonly DesktopSessionFile[]> {
  const results: DesktopSessionFile[] = [];

  try {
    const entries = await readdir(spaceDir, { withFileTypes: true });

    // Find local_*.json metadata files
    const metadataFiles = entries.filter(
      (e) => e.isFile() && e.name.startsWith('local_') && e.name.endsWith('.json'),
    );

    for (const metaFile of metadataFiles) {
      const sessionDirName = metaFile.name.replace('.json', '');
      const auditLogPath = join(spaceDir, sessionDirName, 'audit.jsonl');

      if (!(await pathExists(auditLogPath))) continue;

      const metadataPath = join(spaceDir, metaFile.name);
      const metadata = await readMetadataFile(metadataPath);
      if (!metadata) continue;

      try {
        const auditStat = await stat(auditLogPath);
        results.push({
          sessionId: metadata.sessionId,
          auditLogPath,
          metadataPath,
          lastModifiedMs: auditStat.mtimeMs,
          metadata,
        });
      } catch {
        // Skip files we can't stat
      }
    }
  } catch {
    // Skip directories we can't read
  }

  return results;
}

/**
 * Discover all Desktop App sessions across all workspaces and spaces.
 * Returns empty array on non-macOS or if base path doesn't exist.
 */
export async function findDesktopSessionFiles(): Promise<readonly DesktopSessionFile[]> {
  const basePath = getDesktopBasePath();
  if (!basePath || !(await pathExists(basePath))) return [];

  const results: DesktopSessionFile[] = [];

  try {
    const workspaceDirs = await readdir(basePath, { withFileTypes: true });

    for (const workspaceEntry of workspaceDirs) {
      if (!workspaceEntry.isDirectory()) continue;

      const workspacePath = join(basePath, workspaceEntry.name);

      try {
        const spaceDirs = await readdir(workspacePath, { withFileTypes: true });

        for (const spaceEntry of spaceDirs) {
          if (!spaceEntry.isDirectory()) continue;

          const spacePath = join(workspacePath, spaceEntry.name);
          const spaceResults = await scanSpaceDirectory(spacePath);
          results.push(...spaceResults);
        }
      } catch {
        // Skip workspaces we can't read
      }
    }
  } catch {
    // Base path doesn't exist or can't be read
  }

  return results;
}

/**
 * Find Desktop sessions that match any of the given directories.
 * Matches by checking if any of the session's userSelectedFolders is in the target set.
 */
export function filterDesktopSessionsByDirectories(
  sessions: readonly DesktopSessionFile[],
  targetDirectories: ReadonlySet<string>,
): readonly DesktopSessionFile[] {
  return sessions.filter((session) =>
    session.metadata.userSelectedFolders.some((folder) => targetDirectories.has(folder)),
  );
}
