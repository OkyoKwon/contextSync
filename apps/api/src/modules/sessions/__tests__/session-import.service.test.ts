import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../session.repository.js', () => ({
  createSession: vi.fn(),
  createMessages: vi.fn(),
}));

vi.mock('../../conflicts/conflict.service.js', () => ({
  detectConflicts: vi.fn(),
  saveDetectedConflicts: vi.fn(),
}));

vi.mock('../../activity/activity.service.js', () => ({
  logActivity: vi.fn(),
}));

vi.mock('../parsers/json-session.parser.js', () => ({
  parseJsonSession: vi.fn(),
  parseJsonlSession: vi.fn(),
  extractFilePathsFromMessages: vi.fn(),
}));

vi.mock('../parsers/markdown-session.parser.js', () => ({
  parseMarkdownSession: vi.fn(),
}));

import { createSession, createMessages } from '../session.repository.js';
import { detectConflicts, saveDetectedConflicts } from '../../conflicts/conflict.service.js';
import { logActivity } from '../../activity/activity.service.js';
import {
  parseJsonSession,
  parseJsonlSession,
  extractFilePathsFromMessages,
} from '../parsers/json-session.parser.js';
import { parseMarkdownSession } from '../parsers/markdown-session.parser.js';
import { importSession, importParsedSession } from '../session-import.service.js';
import { AppError } from '../../../plugins/error-handler.plugin.js';

const mockCreateSession = vi.mocked(createSession);
const mockCreateMessages = vi.mocked(createMessages);
const mockDetectConflicts = vi.mocked(detectConflicts);
const mockSaveConflicts = vi.mocked(saveDetectedConflicts);
const mockLogActivity = vi.mocked(logActivity);
const mockParseJson = vi.mocked(parseJsonSession);
const mockParseJsonl = vi.mocked(parseJsonlSession);
const mockParseMarkdown = vi.mocked(parseMarkdownSession);
const mockExtractPaths = vi.mocked(extractFilePathsFromMessages);

const db = {} as any;

const MOCK_SESSION = {
  id: 'sess-1',
  projectId: 'proj-1',
  userId: 'user-1',
  title: 'Test',
  source: 'manual' as const,
  status: 'active' as const,
  filePaths: [],
  moduleNames: [],
  branch: null,
  tags: [],
  metadata: {},
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const MOCK_PARSED = {
  title: 'Parsed Session',
  messages: [{ role: 'user', content: 'Hello' }],
  source: 'manual',
  branch: undefined,
  tags: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateSession.mockResolvedValue(MOCK_SESSION);
  mockCreateMessages.mockResolvedValue([]);
  mockDetectConflicts.mockResolvedValue([]);
  mockSaveConflicts.mockResolvedValue([]);
  mockExtractPaths.mockReturnValue(['src/index.ts']);
});

describe('importParsedSession', () => {
  it('should create session, messages, detect conflicts, and log activity', async () => {
    const result = await importParsedSession(db, 'proj-1', 'user-1', MOCK_PARSED as any);

    expect(mockCreateSession).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        projectId: 'proj-1',
        userId: 'user-1',
        title: 'Parsed Session',
      }),
    );
    expect(mockCreateMessages).toHaveBeenCalledWith(db, 'sess-1', MOCK_PARSED.messages);
    expect(mockDetectConflicts).toHaveBeenCalled();
    expect(mockLogActivity).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        action: 'session_created',
        entityId: 'sess-1',
      }),
    );
    expect(result.session.id).toBe('sess-1');
    expect(result.detectedConflicts).toBe(0);
  });

  it('should report detected conflicts count', async () => {
    mockSaveConflicts.mockResolvedValue([{ id: 'c-1' }, { id: 'c-2' }] as any);

    const result = await importParsedSession(db, 'proj-1', 'user-1', MOCK_PARSED as any);

    expect(result.detectedConflicts).toBe(2);
  });
});

describe('importSession', () => {
  it('should parse JSON file and import', async () => {
    mockParseJson.mockReturnValue(MOCK_PARSED as any);

    await importSession(db, 'proj-1', 'user-1', 'session.json', '{}');

    expect(mockParseJson).toHaveBeenCalledWith('{}');
    expect(mockCreateSession).toHaveBeenCalled();
  });

  it('should parse JSONL file and import', async () => {
    mockParseJsonl.mockReturnValue(MOCK_PARSED as any);

    await importSession(db, 'proj-1', 'user-1', 'session.jsonl', '{}');

    expect(mockParseJsonl).toHaveBeenCalledWith('{}');
  });

  it('should parse Markdown file and import', async () => {
    mockParseMarkdown.mockReturnValue(MOCK_PARSED as any);

    await importSession(db, 'proj-1', 'user-1', 'session.md', '# Session');

    expect(mockParseMarkdown).toHaveBeenCalledWith('# Session');
  });

  it('should throw AppError for unsupported file format', async () => {
    await expect(importSession(db, 'proj-1', 'user-1', 'session.exe', 'content')).rejects.toThrow(
      AppError,
    );
  });
});
