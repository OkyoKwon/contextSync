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

  if (
    record['source'] &&
    !SESSION_SOURCES.includes(record['source'] as (typeof SESSION_SOURCES)[number])
  ) {
    errors.push(`source must be one of: ${SESSION_SOURCES.join(', ')}`);
  }

  if (!Array.isArray(record['messages']) || record['messages'].length === 0) {
    errors.push('messages must be a non-empty array');
  } else {
    for (let i = 0; i < record['messages'].length; i++) {
      const msg = record['messages'][i] as Record<string, unknown> | null;
      if (!msg || typeof msg !== 'object') {
        errors.push(`messages[${i}] must be an object`);
        continue;
      }
      if (typeof msg['role'] !== 'string' || !msg['role']) {
        errors.push(`messages[${i}].role is required and must be a string`);
      }
      if (typeof msg['content'] !== 'string' || !msg['content']) {
        errors.push(`messages[${i}].content is required and must be a string`);
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const validatedData: SessionImportData = {
    title: record['title'] as string,
    source: record['source'] as string | undefined,
    branch: record['branch'] as string | undefined,
    tags: Array.isArray(record['tags']) ? (record['tags'] as string[]) : undefined,
    messages: (record['messages'] as Array<Record<string, unknown>>).map((m) => ({
      role: m['role'] as string,
      content: m['content'] as string,
      contentType: m['contentType'] as string | undefined,
      tokensUsed: typeof m['tokensUsed'] === 'number' ? m['tokensUsed'] : undefined,
      modelUsed: m['modelUsed'] as string | undefined,
    })),
  };

  return { valid: true, errors: [], data: validatedData };
}
