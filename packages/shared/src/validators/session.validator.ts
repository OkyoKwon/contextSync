import { SESSION_SOURCES } from '../constants/session-status.js';

export interface SessionImportData {
  readonly title: string;
  readonly source?: string;
  readonly branch?: string;
  readonly tags?: readonly string[];
  readonly messages: readonly {
    readonly role: string;
    readonly content: string;
    readonly contentType?: string;
    readonly tokensUsed?: number;
    readonly modelUsed?: string;
  }[];
}

export function validateSessionImport(data: unknown): {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly data?: SessionImportData;
} {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Input must be an object'] };
  }

  const record = data as Record<string, unknown>;

  if (!record['title'] || typeof record['title'] !== 'string') {
    errors.push('title is required and must be a string');
  }

  if (record['source'] && !SESSION_SOURCES.includes(record['source'] as typeof SESSION_SOURCES[number])) {
    errors.push(`source must be one of: ${SESSION_SOURCES.join(', ')}`);
  }

  if (!Array.isArray(record['messages']) || record['messages'].length === 0) {
    errors.push('messages must be a non-empty array');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], data: record as unknown as SessionImportData };
}
