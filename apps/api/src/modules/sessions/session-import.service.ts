import type { Db } from '../../database/client.js';
import type { SessionImportResult } from '@context-sync/shared';
import type { SessionImportData } from '@context-sync/shared';
import { parseJsonSession, parseJsonlSession, extractFilePathsFromMessages } from './parsers/json-session.parser.js';
import { parseMarkdownSession } from './parsers/markdown-session.parser.js';
import { createSession, createMessages } from './session.repository.js';
import { detectConflicts, saveDetectedConflicts } from '../conflicts/conflict.service.js';
import { AppError } from '../../plugins/error-handler.plugin.js';

export async function importParsedSession(
  db: Db,
  projectId: string,
  userId: string,
  parsed: SessionImportData,
  filePaths?: readonly string[],
): Promise<SessionImportResult> {
  const resolvedPaths = filePaths ?? extractFilePathsFromMessages(parsed.messages);

  const session = await createSession(db, {
    projectId,
    userId,
    title: parsed.title,
    source: (parsed.source as 'claude_code' | 'claude_ai' | 'api' | 'manual') ?? 'manual',
    branch: parsed.branch,
    tags: parsed.tags,
    filePaths: resolvedPaths,
  });

  const messages = await createMessages(db, session.id, parsed.messages);

  const conflicts = await detectConflicts(db, session);
  const savedConflicts = await saveDetectedConflicts(db, projectId, conflicts);

  return {
    session: { ...session, filePaths: resolvedPaths },
    messageCount: messages.length,
    detectedConflicts: savedConflicts.length,
  };
}

export async function importSession(
  db: Db,
  projectId: string,
  userId: string,
  fileName: string,
  content: string,
): Promise<SessionImportResult> {
  const parsed = parseFile(fileName, content);
  const filePaths = extractFilePathsFromMessages(parsed.messages);
  return importParsedSession(db, projectId, userId, parsed, filePaths);
}

function parseFile(fileName: string, content: string) {
  const ext = fileName.toLowerCase().split('.').pop();

  switch (ext) {
    case 'json':
      return parseJsonSession(content);
    case 'jsonl':
      return parseJsonlSession(content);
    case 'md':
    case 'markdown':
      return parseMarkdownSession(content);
    default:
      throw new AppError(`Unsupported file format: .${ext}. Use .json, .jsonl, or .md`);
  }
}
