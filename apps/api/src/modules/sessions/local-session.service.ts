import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { Db } from '../../database/client.js';
import type { LocalDirectory, LocalProjectGroup, LocalSessionInfo, LocalSessionDetail, LocalSessionMessage, SyncSessionResult, SyncSingleResult, ProjectConversation, UnifiedMessage } from '@context-sync/shared';
import { parseClaudeCodeSession, parseClaudeCodeSessionWithTimestamps, previewClaudeCodeSession } from './parsers/claude-code-session.parser.js';
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

// Maximum number of inactive files to read when activeOnly=false
const MAX_INACTIVE_FILES = 50;

export async function listLocalDirectories(): Promise<readonly LocalDirectory[]> {
  const sessionFiles = await findSessionFiles();

  // Group files by directory, track counts and latest modification
  const dirMap = new Map<string, { count: number; latestMs: number }>();

  for (const file of sessionFiles) {
    const existing = dirMap.get(file.dir);
    if (existing) {
      dirMap.set(file.dir, {
        count: existing.count + 1,
        latestMs: Math.max(existing.latestMs, file.lastModifiedMs),
      });
    } else {
      dirMap.set(file.dir, { count: 1, latestMs: file.lastModifiedMs });
    }
  }

  const now = Date.now();
  const directories: LocalDirectory[] = [...dirMap.entries()].map(([dirName, info]) => ({
    path: decodeProjectPath(dirName),
    sessionCount: info.count,
    lastActivityAt: new Date(info.latestMs).toISOString(),
    isActive: now - info.latestMs < ACTIVE_THRESHOLD_MS,
  }));

  // Sort by most recent activity first
  directories.sort((a, b) => (b.lastActivityAt > a.lastActivityAt ? 1 : -1));

  return directories;
}

export async function listLocalSessions(
  db: Db,
  projectId: string,
  activeOnly = true,
): Promise<readonly LocalProjectGroup[]> {
  // Look up the project's linked local_directory
  const project = await db
    .selectFrom('projects')
    .select(['local_directory'])
    .where('id', '=', projectId)
    .executeTakeFirst();

  if (!project?.local_directory) return [];

  const encodedDir = encodeProjectPath(project.local_directory);

  const allSessionFiles = await findSessionFiles();
  const sessionFiles = allSessionFiles.filter((f) => f.dir === encodedDir);

  if (sessionFiles.length === 0) return [];

  const now = Date.now();

  // Get already-synced session IDs for this project
  const syncedRows = await db
    .selectFrom('synced_sessions')
    .select(['external_session_id'])
    .where('project_id', '=', projectId)
    .execute();

  const syncedIds = new Set(syncedRows.map((r) => r.external_session_id));

  // Partition files by active status using stat mtime (no readFile needed)
  const activeFiles: SessionFile[] = [];
  const inactiveFiles: SessionFile[] = [];

  for (const file of sessionFiles) {
    if (now - file.lastModifiedMs < ACTIVE_THRESHOLD_MS) {
      activeFiles.push(file);
    } else {
      inactiveFiles.push(file);
    }
  }

  // Determine which files to actually read
  const filesToRead: readonly SessionFile[] = activeOnly
    ? activeFiles
    : [
        ...activeFiles,
        // For inactive files: sort by most recent first, cap at MAX_INACTIVE_FILES
        ...[...inactiveFiles]
          .sort((a, b) => b.lastModifiedMs - a.lastModifiedMs)
          .slice(0, MAX_INACTIVE_FILES),
      ];

  // Build session infos — only read files we selected
  const allSessions: LocalSessionInfo[] = [];

  for (const file of filesToRead) {
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

export async function getLocalSessionDetail(sessionId: string): Promise<LocalSessionDetail> {
  const sessionFiles = await findSessionFiles();
  const file = sessionFiles.find((f) => f.fileName.replace('.jsonl', '') === sessionId);

  if (!file) {
    const err = new Error(`Local session not found: ${sessionId}`);
    (err as NodeJS.ErrnoException).code = 'NOT_FOUND';
    throw err;
  }

  const content = await readFile(file.fullPath, 'utf-8');
  const { parsed, filePaths } = parseClaudeCodeSession(content);
  const projectPath = decodeProjectPath(file.dir);

  const messages: readonly LocalSessionMessage[] = parsed.messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
    modelUsed: m.modelUsed,
    tokensUsed: m.tokensUsed,
  }));

  const firstTimestamp = findFirstTimestamp(content);

  return {
    sessionId,
    projectPath,
    title: parsed.title,
    branch: parsed.branch ?? null,
    filePaths,
    messages,
    startedAt: firstTimestamp,
    lastModifiedAt: new Date(file.lastModifiedMs).toISOString(),
  };
}

function findFirstTimestamp(raw: string): string | null {
  const lines = raw.trim().split('\n');
  for (const line of lines.slice(0, 10)) {
    try {
      const record = JSON.parse(line) as Record<string, unknown>;
      if ('timestamp' in record && record['timestamp']) {
        return String(record['timestamp']);
      }
    } catch {
      continue;
    }
  }
  return null;
}

function encodeProjectPath(absolutePath: string): string {
  return absolutePath.replace(/\//g, '-');
}

export async function getProjectConversation(
  projectPath: string,
  cursor?: string,
  limit = 100,
): Promise<ProjectConversation> {
  const sessionFiles = await findSessionFiles();
  const encodedPath = encodeProjectPath(projectPath);
  const projectFiles = sessionFiles.filter((f) => f.dir === encodedPath);

  const allMessages: UnifiedMessage[] = [];

  for (const file of projectFiles) {
    const sessionId = file.fileName.replace('.jsonl', '');
    try {
      const content = await readFile(file.fullPath, 'utf-8');
      const result = parseClaudeCodeSessionWithTimestamps(content);

      for (const msg of result.messages) {
        allMessages.push({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          sessionId,
          sessionTitle: result.title,
          modelUsed: msg.modelUsed,
          tokensUsed: msg.tokensUsed,
        });
      }
    } catch {
      // Skip unparseable files
    }
  }

  // Sort by timestamp ascending
  allMessages.sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0));

  // Apply cursor filter
  const filtered = cursor
    ? allMessages.filter((m) => m.timestamp > cursor)
    : allMessages;

  // Slice for pagination
  const sliced = filtered.slice(0, limit + 1);
  const hasMore = sliced.length > limit;
  const messages = hasMore ? sliced.slice(0, limit) : sliced;
  const lastMessage = messages[messages.length - 1];
  const nextCursor = hasMore && lastMessage ? lastMessage.timestamp : null;

  const sessionIds = new Set(projectFiles.map((f) => f.fileName.replace('.jsonl', '')));

  return {
    projectPath,
    messages,
    sessionCount: sessionIds.size,
    totalMessages: allMessages.length,
    hasMore,
    nextCursor,
  };
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
