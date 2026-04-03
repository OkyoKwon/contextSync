import type { ClaudeCodeParseResult } from './claude-code-session.parser.js';
import { parseClaudeCodeSession } from './claude-code-session.parser.js';
import { parseClaudeCodeSessionWithTimestamps } from './claude-code-session-timestamps.parser.js';
import type { TimestampedParseResult } from './claude-code-session-timestamps.parser.js';

/**
 * Normalize Desktop App audit.jsonl to Claude Code .jsonl format.
 * - Renames `_audit_timestamp` → `timestamp`
 * - Strips `_audit_hmac` field
 * - Skips non-conversation record types (rate_limit_event, result, permission)
 */
function normalizeAuditLog(raw: string): string {
  const lines = raw.split('\n');
  const normalized: string[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const record = JSON.parse(line) as Record<string, unknown>;
      const type = record['type'] as string | undefined;

      // Skip Desktop-specific non-conversation records
      if (
        type === 'rate_limit_event' ||
        type === 'result' ||
        (type === 'system' && record['subtype'] === 'permission_request') ||
        (type === 'system' && record['subtype'] === 'permission_response')
      ) {
        continue;
      }

      // Rename _audit_timestamp → timestamp
      if ('_audit_timestamp' in record && !('timestamp' in record)) {
        record['timestamp'] = record['_audit_timestamp'];
        delete record['_audit_hmac'];
        delete record['_audit_timestamp'];
        normalized.push(JSON.stringify(record));
      } else {
        normalized.push(line);
      }
    } catch {
      normalized.push(line);
    }
  }

  return normalized.join('\n');
}

export function parseDesktopAuditSession(
  raw: string,
  metadataTitle?: string,
): ClaudeCodeParseResult {
  const normalized = normalizeAuditLog(raw);
  const result = parseClaudeCodeSession(normalized);

  return {
    parsed: {
      ...result.parsed,
      source: 'claude_ai',
      ...(metadataTitle ? { title: metadataTitle } : {}),
    },
    filePaths: result.filePaths,
  };
}

export function parseDesktopAuditSessionWithTimestamps(
  raw: string,
  metadataTitle?: string,
): TimestampedParseResult {
  const normalized = normalizeAuditLog(raw);
  const result = parseClaudeCodeSessionWithTimestamps(normalized);

  return {
    ...result,
    ...(metadataTitle ? { title: metadataTitle } : {}),
  };
}
