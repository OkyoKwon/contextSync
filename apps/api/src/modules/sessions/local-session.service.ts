import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { Db } from '../../database/client.js';
import type { LocalProjectGroup, LocalSessionInfo, SyncSessionResult, SyncSingleResult } from '@context-sync/shared';
import { parseClaudeCodeSession, previewClaudeCodeSession } from './parsers/claude-code-session.parser.js';
import { importParsedSession } from './session-import.service.js';

const CLAUDE_PROJECTS_DIR = join(homedir(), '.claude', 'projects');

// Sessions modified within this threshold are considered "active"
const ACTIVE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

interface SessionFile {
  readonly dir: string;
  readonly fileName: string;
  readonly fullPath: string;
  readonly lastModifiedMs: number;
}

async function findSessionFiles(): Promise<readonly SessionFile[]> {
  const results: SessionFile[] = [];

  try {
    const projectDirs = await readdir(CLAUDE_PROJECTS_DIR, { withFileTypes: true });

    for (const entry of projectDirs) {
      if (!entry.isDirectory()) continue;

      const dirPath = join(CLAUDE_PROJECTS_DIR, entry.name);
      try {
        const files = await readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
          if (file.isFile() && file.name.endsWith('.jsonl')) {
            const fullPath = join(dirPath, file.name);
            try {
              const fileStat = await stat(fullPath);
              results.push({
                dir: entry.name,
                fileName: file.name,
                fullPath,
                lastModifiedMs: fileStat.mtimeMs,
              });
            } catch {
              // Skip files we can't stat
            }
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }
  } catch {
    // ~/.claude/projects/ doesn't exist or can't be read
  }

  return results;
}

function decodeProjectPath(dirName: string): string {
  // Directory names encode absolute paths: -Users-foo-bar → /Users/foo/bar
  return '/' + dirName.slice(1).replace(/-/g, '/');
}

export async function listLocalSessions(db: Db, projectId: string): Promise<readonly LocalProjectGroup[]> {
  const sessionFiles = await findSessionFiles();
  const now = Date.now();

  // Get already-synced session IDs for this project
  const syncedRows = await db
    .selectFrom('synced_sessions')
    .select(['external_session_id'])
    .where('project_id', '=', projectId)
    .execute();

  const syncedIds = new Set(syncedRows.map((r) => r.external_session_id));

  // Build session infos with active detection
  const allSessions: LocalSessionInfo[] = [];

  for (const file of sessionFiles) {
    const sessionId = file.fileName.replace('.jsonl', '');
    const projectPath = decodeProjectPath(file.dir);
    const isActive = (now - file.lastModifiedMs) < ACTIVE_THRESHOLD_MS;

    try {
      const content = await readFile(file.fullPath, 'utf-8');
      const preview = previewClaudeCodeSession(content);

      if (preview.messageCount === 0) continue;

      allSessions.push({
        sessionId,
        projectPath,
        firstMessage: preview.firstMessage,
        messageCount: preview.messageCount,
        startedAt: preview.startedAt ?? new Date().toISOString(),
        lastModifiedAt: new Date(file.lastModifiedMs).toISOString(),
        isSynced: syncedIds.has(sessionId),
        isActive,
      });
    } catch {
      // Skip files we can't read
    }
  }

  // Group by projectPath
  const groupMap = new Map<string, LocalSessionInfo[]>();
  for (const session of allSessions) {
    const existing = groupMap.get(session.projectPath) ?? [];
    groupMap.set(session.projectPath, [...existing, session]);
  }

  // Build groups, sorted by most recent activity
  const groups: LocalProjectGroup[] = [...groupMap.entries()].map(([projectPath, sessions]) => {
    const sorted = [...sessions].sort((a, b) => (b.lastModifiedAt > a.lastModifiedAt ? 1 : -1));
    return {
      projectPath,
      sessions: sorted,
      totalMessages: sorted.reduce((sum, s) => sum + s.messageCount, 0),
      isActive: sorted.some((s) => s.isActive),
    };
  });

  // Active groups first, then sort by most recent session
  groups.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    const aLatest = a.sessions[0]?.lastModifiedAt ?? '';
    const bLatest = b.sessions[0]?.lastModifiedAt ?? '';
    return bLatest > aLatest ? 1 : -1;
  });

  return groups;
}

export async function syncSessions(
  db: Db,
  projectId: string,
  userId: string,
  sessionIds: readonly string[],
): Promise<SyncSessionResult> {
  const sessionFiles = await findSessionFiles();
  const fileMap = new Map(sessionFiles.map((f) => [f.fileName.replace('.jsonl', ''), f]));

  const results: SyncSingleResult[] = [];
  let syncedCount = 0;

  for (const sessionId of sessionIds) {
    try {
      const file = fileMap.get(sessionId);
      if (!file) {
        results.push({ sessionId, success: false, error: 'Session file not found' });
        continue;
      }

      const content = await readFile(file.fullPath, 'utf-8');
      const { parsed, filePaths } = parseClaudeCodeSession(content);

      const importResult = await importParsedSession(db, projectId, userId, parsed, filePaths);

      // Record sync tracking
      await db
        .insertInto('synced_sessions')
        .values({
          project_id: projectId,
          session_id: importResult.session.id,
          external_session_id: sessionId,
          source_path: file.fullPath,
        })
        .onConflict((oc) => oc.columns(['project_id', 'external_session_id']).doNothing())
        .execute();

      results.push({
        sessionId,
        success: true,
        messageCount: importResult.messageCount,
        detectedConflicts: importResult.detectedConflicts,
      });
      syncedCount++;
    } catch (err) {
      results.push({
        sessionId,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return { syncedCount, results };
}
