import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve, normalize } from 'node:path';
import { homedir } from 'node:os';
import type { Db } from '../../database/client.js';
import type {
  LocalDirectory,
  LocalProjectGroup,
  LocalSessionInfo,
  LocalSessionDetail,
  LocalSessionMessage,
  ProjectConversation,
  UnifiedMessage,
  BrowseDirectoryEntry,
} from '@context-sync/shared';
import {
  parseClaudeCodeSession,
  parseClaudeCodeSessionWithTimestamps,
} from '../sessions/parsers/claude-code-session.parser.js';
import { getProjectSessionFiles, getProjectDirectoryOwners } from './local-session.sync.js';

const CLAUDE_PROJECTS_DIR = join(homedir(), '.claude', 'projects');

// Sessions modified within this threshold are considered "active"
const ACTIVE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export interface SessionFile {
  readonly dir: string;
  readonly fileName: string;
  readonly fullPath: string;
  readonly lastModifiedMs: number;
}

export async function findSessionFiles(): Promise<readonly SessionFile[]> {
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

function encodeProjectPath(absolutePath: string): string {
  return absolutePath.replace(/\//g, '-');
}

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
  metaDb: Db,
  dataDb: Db,
  projectId: string,
  activeOnly = true,
  currentUserId?: string,
): Promise<readonly LocalProjectGroup[]> {
  const sessionFiles = await getProjectSessionFiles(metaDb, projectId);

  const directoryOwners = await getProjectDirectoryOwners(metaDb, projectId);

  const now = Date.now();

  // Get already-synced session IDs from the data DB (where sessions live)
  const syncedRows = await dataDb
    .selectFrom('synced_sessions')
    .select(['external_session_id'])
    .where('project_id', '=', projectId)
    .execute();

  const syncedIds = new Set(syncedRows.map((r) => r.external_session_id));

  // Read ALL local files to get accurate total counts
  const allSessions: LocalSessionInfo[] = [];

  for (const file of sessionFiles) {
    const sessionId = file.fileName.replace('.jsonl', '');
    const projectPath = decodeProjectPath(file.dir);
    const isActive = now - file.lastModifiedMs < ACTIVE_THRESHOLD_MS;

    try {
      const content = await readFile(file.fullPath, 'utf-8');
      const result = parseClaudeCodeSessionWithTimestamps(content);

      if (result.messages.length === 0) continue;

      allSessions.push({
        sessionId,
        projectPath,
        firstMessage: result.title,
        messageCount: result.messages.length,
        totalTokens: result.messages.reduce((sum, m) => sum + (m.tokensUsed ?? 0), 0),
        startedAt: result.messages[0]?.timestamp ?? new Date().toISOString(),
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

  // Build an encoded-key lookup for directoryOwners so that paths with hyphens
  // (e.g. "crypto-talk" encoded as "crypto-talk" → decoded as "crypto/talk")
  // still match the original DB local_directory value.
  const encodedOwnerMap = new Map<
    string,
    { readonly name: string; readonly avatarUrl: string | null }
  >();
  for (const [dir, owner] of directoryOwners) {
    encodedOwnerMap.set(encodeProjectPath(dir), owner);
  }

  // Build groups, sorted by most recent activity
  const groups: LocalProjectGroup[] = [...groupMap.entries()].map(([projectPath, sessions]) => {
    const sorted = [...sessions].sort((a, b) => (b.lastModifiedAt > a.lastModifiedAt ? 1 : -1));
    const totalMessages = sorted.reduce((sum, s) => sum + s.messageCount, 0);
    const totalSessionCount = sorted.length;

    // Determine which sessions to include in the list
    const displaySessions = activeOnly ? sorted.filter((s) => s.isActive) : sorted;

    // Match owner by both decoded path and encoded path to handle hyphenated directory names
    const owner =
      directoryOwners.get(projectPath) ?? encodedOwnerMap.get(encodeProjectPath(projectPath));

    return {
      projectPath,
      sessions: displaySessions,
      totalMessages,
      totalSessionCount,
      isActive: sorted.some((s) => s.isActive),
      ...(owner ? { ownerName: owner.name, ownerAvatarUrl: owner.avatarUrl } : {}),
    };
  });

  // Include DB sessions from other team members (from the data DB)
  // Use local file session IDs (not all synced IDs) to avoid filtering out other members' sessions
  if (currentUserId) {
    const localFileSessionIds = new Set(allSessions.map((s) => s.sessionId));
    const teamGroups = await getTeamDbSessionGroups(
      dataDb,
      projectId,
      currentUserId,
      localFileSessionIds,
    );
    groups.push(...teamGroups);
  }

  // Active groups first, then sort by most recent session
  groups.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    const aLatest = a.sessions[0]?.lastModifiedAt ?? '';
    const bLatest = b.sessions[0]?.lastModifiedAt ?? '';
    return bLatest > aLatest ? 1 : -1;
  });

  return groups;
}

/**
 * Fetch sessions synced by other team members from the DB and return as LocalProjectGroup[].
 * Excludes sessions that already appear in local file groups (by external_session_id).
 */
async function getTeamDbSessionGroups(
  db: Db,
  projectId: string,
  currentUserId: string,
  localSyncedIds: ReadonlySet<string>,
): Promise<LocalProjectGroup[]> {
  // Get sessions from DB that belong to OTHER users in this project
  const dbSessions = await db
    .selectFrom('sessions')
    .innerJoin('users', 'users.id', 'sessions.user_id')
    .leftJoin('synced_sessions', (join) =>
      join
        .onRef('synced_sessions.session_id', '=', 'sessions.id')
        .on('synced_sessions.project_id', '=', projectId),
    )
    .select([
      'sessions.id',
      'sessions.user_id',
      'sessions.title',
      'sessions.created_at',
      'sessions.updated_at',
      'users.name as user_name',
      'users.avatar_url as user_avatar_url',
      'synced_sessions.external_session_id',
      db.fn.count('messages.id').as('message_count'),
    ])
    .leftJoin('messages', 'messages.session_id', 'sessions.id')
    .where('sessions.project_id', '=', projectId)
    .where('sessions.user_id', '!=', currentUserId)
    .groupBy([
      'sessions.id',
      'sessions.user_id',
      'sessions.title',
      'sessions.created_at',
      'sessions.updated_at',
      'users.name',
      'users.avatar_url',
      'synced_sessions.external_session_id',
    ])
    .orderBy('sessions.created_at', 'desc')
    .execute();

  if (dbSessions.length === 0) return [];

  // Filter out sessions that are already visible as local files
  const filtered = dbSessions.filter((s) => {
    if (!s.external_session_id) return true;
    return !localSyncedIds.has(s.external_session_id);
  });

  if (filtered.length === 0) return [];

  // Group by user
  const userGroupMap = new Map<
    string,
    { sessions: LocalSessionInfo[]; userName: string; userAvatarUrl: string | null }
  >();

  for (const row of filtered) {
    const userId = row.user_id;
    const existing = userGroupMap.get(userId) ?? {
      sessions: [],
      userName: row.user_name,
      userAvatarUrl: row.user_avatar_url,
    };

    existing.sessions.push({
      sessionId: row.id,
      projectPath: `@${row.user_name}`,
      firstMessage: row.title,
      messageCount: Number(row.message_count),
      totalTokens: 0,
      startedAt: (row.created_at as Date).toISOString(),
      lastModifiedAt: (row.updated_at as Date).toISOString(),
      isSynced: true,
      isActive: false,
      isRemote: true,
      dbSessionId: row.id,
    });

    userGroupMap.set(userId, existing);
  }

  return [...userGroupMap.entries()].map(([, group]) => {
    const totalMessages = group.sessions.reduce((sum, s) => sum + s.messageCount, 0);
    return {
      projectPath: `@${group.userName}`,
      sessions: group.sessions,
      totalMessages,
      totalSessionCount: group.sessions.length,
      isActive: false,
      ownerName: group.userName,
      ownerAvatarUrl: group.userAvatarUrl,
    };
  });
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

export function findFirstTimestamp(raw: string): string | null {
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

export async function countLocalSessionsByDate(
  metaDb: Db,
  projectId: string,
): Promise<{ readonly todaySessions: number; readonly weekSessions: number }> {
  const sessionFiles = await getProjectSessionFiles(metaDb, projectId);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const todayMs = todayStart.getTime();
  const weekMs = weekStart.getTime();

  let todaySessions = 0;
  let weekSessions = 0;

  for (const file of sessionFiles) {
    try {
      const content = await readFile(file.fullPath, 'utf-8');
      const timestamp = findFirstTimestamp(content);
      if (!timestamp) continue;

      const startedMs = new Date(timestamp).getTime();
      if (startedMs >= weekMs) {
        weekSessions++;
        if (startedMs >= todayMs) {
          todaySessions++;
        }
      }
    } catch {
      // Skip files we can't read
    }
  }

  return { todaySessions, weekSessions };
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
  const filtered = cursor ? allMessages.filter((m) => m.timestamp > cursor) : allMessages;

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

const DANGEROUS_PATH_SEGMENTS = ['..', '\0'];

function isPathSafe(dirPath: string): boolean {
  const normalized = normalize(dirPath);
  if (!normalized.startsWith('/')) return false;
  return !DANGEROUS_PATH_SEGMENTS.some((seg) => normalized.includes(seg));
}

export async function browseDirectory(dirPath?: string): Promise<readonly BrowseDirectoryEntry[]> {
  const targetPath = dirPath ? resolve(dirPath) : homedir();

  if (!isPathSafe(targetPath)) {
    throw Object.assign(new Error('Invalid directory path'), { statusCode: 400 });
  }

  const entries = await readdir(targetPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => ({
      name: entry.name,
      path: join(targetPath, entry.name),
      isDirectory: true,
    }));
}
