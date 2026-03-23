import { describe, it, expect } from 'vitest';
import {
  parseClaudeCodeSession,
  parseClaudeCodeSessionWithTimestamps,
  previewClaudeCodeSession,
} from '../claude-code-session.parser.js';
import { stripSystemXmlContent } from '../title.utils.js';

function makeRecord(overrides: Record<string, unknown>): string {
  return JSON.stringify({
    type: 'assistant',
    requestId: 'req_001',
    timestamp: '2026-03-20T10:00:00Z',
    userType: 'external',
    cwd: '/test',
    sessionId: 'sess_001',
    version: '1',
    ...overrides,
  });
}

function makeUserRecord(
  content: string | { type: string; text?: string; source?: unknown }[],
  overrides: Record<string, unknown> = {},
): string {
  return makeRecord({
    type: 'user',
    requestId: undefined,
    promptId: 'prompt_001',
    message: { role: 'user', content },
    ...overrides,
  });
}

function makeAssistantRecord(
  contentBlocks: { type: string; text?: string; name?: string }[],
  usage: Record<string, number> = {},
  overrides: Record<string, unknown> = {},
): string {
  return makeRecord({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: contentBlocks,
      model: 'claude-sonnet-4-20250514',
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        ...usage,
      },
    },
    ...overrides,
  });
}

describe('parseClaudeCodeSession', () => {
  it('includes cache tokens in tokensUsed', () => {
    const raw = [
      makeUserRecord('Hello'),
      makeAssistantRecord([{ type: 'text', text: 'Hi there' }], {
        input_tokens: 5,
        output_tokens: 20,
        cache_creation_input_tokens: 3000,
        cache_read_input_tokens: 10000,
      }),
    ].join('\n');

    const { parsed } = parseClaudeCodeSession(raw);
    const assistantMsg = parsed.messages.find((m) => m.role === 'assistant');

    expect(assistantMsg?.tokensUsed).toBe(5 + 20 + 3000 + 10000);
  });

  it('deduplicates usage within same requestId', () => {
    const raw = [
      makeUserRecord('Hello'),
      // Same requestId, 3 blocks — should only count the last usage
      makeAssistantRecord(
        [{ type: 'thinking' }],
        { input_tokens: 3, output_tokens: 9, cache_read_input_tokens: 14000 },
        { requestId: 'req_turn1' },
      ),
      makeAssistantRecord(
        [{ type: 'tool_use', name: 'Read' }],
        { input_tokens: 3, output_tokens: 9, cache_read_input_tokens: 14000 },
        { requestId: 'req_turn1' },
      ),
      makeAssistantRecord(
        [{ type: 'tool_use', name: 'Grep' }],
        { input_tokens: 3, output_tokens: 190, cache_read_input_tokens: 14000 },
        { requestId: 'req_turn1' },
      ),
    ].join('\n');

    const { parsed } = parseClaudeCodeSession(raw);
    const assistantMessages = parsed.messages.filter((m) => m.role === 'assistant');

    // Should produce 1 message (merged turn), not 3
    expect(assistantMessages).toHaveLength(1);
    // Usage from last record: 3 + 190 + 14000 = 14193
    expect(assistantMessages[0]!.tokensUsed).toBe(3 + 190 + 14000);
  });

  it('creates messages for tool-use-only turns', () => {
    const raw = [
      makeUserRecord('Read my file'),
      makeAssistantRecord(
        [{ type: 'tool_use', name: 'Read' }],
        { input_tokens: 1, output_tokens: 100, cache_read_input_tokens: 20000 },
        { requestId: 'req_tool' },
      ),
      makeAssistantRecord(
        [{ type: 'tool_use', name: 'Grep' }],
        { input_tokens: 1, output_tokens: 200, cache_read_input_tokens: 20000 },
        { requestId: 'req_tool' },
      ),
    ].join('\n');

    const { parsed } = parseClaudeCodeSession(raw);
    const assistantMsg = parsed.messages.find((m) => m.role === 'assistant');

    expect(assistantMsg).toBeDefined();
    expect(assistantMsg!.content).toContain('Read');
    expect(assistantMsg!.content).toContain('Grep');
    expect(assistantMsg!.tokensUsed).toBe(1 + 200 + 20000);
  });

  it('handles mixed turns (text + tool_use in same request)', () => {
    const raw = [
      makeUserRecord('Explain and fix'),
      makeAssistantRecord(
        [{ type: 'text', text: 'Here is the explanation' }],
        {
          input_tokens: 2,
          output_tokens: 50,
          cache_creation_input_tokens: 500,
          cache_read_input_tokens: 15000,
        },
        { requestId: 'req_mix' },
      ),
      makeAssistantRecord(
        [{ type: 'tool_use', name: 'Edit' }],
        {
          input_tokens: 2,
          output_tokens: 150,
          cache_creation_input_tokens: 500,
          cache_read_input_tokens: 15000,
        },
        { requestId: 'req_mix' },
      ),
    ].join('\n');

    const { parsed } = parseClaudeCodeSession(raw);
    const assistantMessages = parsed.messages.filter((m) => m.role === 'assistant');

    expect(assistantMessages).toHaveLength(1);
    expect(assistantMessages[0]!.content).toBe('Here is the explanation');
    // Last record's usage: 2 + 150 + 500 + 15000
    expect(assistantMessages[0]!.tokensUsed).toBe(15652);
  });

  it('separates different requestIds into separate messages', () => {
    const raw = [
      makeUserRecord('Do two things'),
      makeAssistantRecord(
        [{ type: 'text', text: 'First thing' }],
        { input_tokens: 1, output_tokens: 10, cache_read_input_tokens: 5000 },
        { requestId: 'req_a' },
      ),
      makeAssistantRecord(
        [{ type: 'text', text: 'Second thing' }],
        { input_tokens: 1, output_tokens: 20, cache_read_input_tokens: 6000 },
        { requestId: 'req_b' },
      ),
    ].join('\n');

    const { parsed } = parseClaudeCodeSession(raw);
    const assistantMessages = parsed.messages.filter((m) => m.role === 'assistant');

    expect(assistantMessages).toHaveLength(2);
    expect(assistantMessages[0]!.tokensUsed).toBe(5011);
    expect(assistantMessages[1]!.tokensUsed).toBe(6021);
  });

  it('preserves timestamps from JSONL records', () => {
    const raw = [
      makeUserRecord('Hello', { timestamp: '2026-03-15T09:00:00Z' }),
      makeAssistantRecord(
        [{ type: 'text', text: 'Hi there' }],
        { input_tokens: 1, output_tokens: 5 },
        { requestId: 'req_ts', timestamp: '2026-03-15T09:00:05Z' },
      ),
      makeUserRecord('Follow up', { timestamp: '2026-03-15T09:01:00Z' }),
      makeAssistantRecord(
        [{ type: 'text', text: 'Sure' }],
        { input_tokens: 1, output_tokens: 3 },
        { requestId: 'req_ts2', timestamp: '2026-03-15T09:01:10Z' },
      ),
    ].join('\n');

    const { parsed } = parseClaudeCodeSession(raw);

    expect(parsed.messages[0]!.timestamp).toBe('2026-03-15T09:00:00Z');
    expect(parsed.messages[1]!.timestamp).toBe('2026-03-15T09:00:05Z');
    expect(parsed.messages[2]!.timestamp).toBe('2026-03-15T09:01:00Z');
    expect(parsed.messages[3]!.timestamp).toBe('2026-03-15T09:01:10Z');
  });

  it('sets timestamp to undefined when JSONL records have no timestamp', () => {
    const raw = [
      makeUserRecord('Hello', { timestamp: undefined }),
      makeAssistantRecord(
        [{ type: 'text', text: 'Hi' }],
        { input_tokens: 1, output_tokens: 5 },
        { requestId: 'req_no_ts', timestamp: undefined },
      ),
    ].join('\n');

    const { parsed } = parseClaudeCodeSession(raw);

    expect(parsed.messages[0]!.timestamp).toBeUndefined();
    expect(parsed.messages[1]!.timestamp).toBeUndefined();
  });

  it('preserves model from assistant records', () => {
    const raw = [
      makeUserRecord('Hi'),
      makeAssistantRecord(
        [{ type: 'text', text: 'Hello' }],
        { input_tokens: 1, output_tokens: 5 },
        {
          requestId: 'req_model',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Hello' }],
            model: 'claude-opus-4-20250514',
            usage: { input_tokens: 1, output_tokens: 5 },
          },
        },
      ),
    ].join('\n');

    const { parsed } = parseClaudeCodeSession(raw);
    const assistantMsg = parsed.messages.find((m) => m.role === 'assistant');

    expect(assistantMsg?.modelUsed).toBe('claude-opus-4-20250514');
  });
});

describe('parseClaudeCodeSessionWithTimestamps', () => {
  it('includes cache tokens and deduplicates by requestId', () => {
    const raw = [
      makeUserRecord('Hello', { timestamp: '2026-03-20T10:00:00Z' }),
      makeAssistantRecord(
        [{ type: 'thinking' }],
        { input_tokens: 3, output_tokens: 9, cache_read_input_tokens: 14000 },
        { requestId: 'req_ts1', timestamp: '2026-03-20T10:00:01Z' },
      ),
      makeAssistantRecord(
        [{ type: 'text', text: 'Response' }],
        { input_tokens: 3, output_tokens: 50, cache_read_input_tokens: 14000 },
        { requestId: 'req_ts1', timestamp: '2026-03-20T10:00:02Z' },
      ),
    ].join('\n');

    const result = parseClaudeCodeSessionWithTimestamps(raw);
    const assistantMessages = result.messages.filter((m) => m.role === 'assistant');

    expect(assistantMessages).toHaveLength(1);
    expect(assistantMessages[0]!.tokensUsed).toBe(3 + 50 + 14000);
    expect(assistantMessages[0]!.timestamp).toBe('2026-03-20T10:00:02Z');
  });

  it('creates tool-use messages with timestamps', () => {
    const raw = [
      makeUserRecord('Do something', { timestamp: '2026-03-20T11:00:00Z' }),
      makeAssistantRecord(
        [{ type: 'tool_use', name: 'Bash' }],
        { input_tokens: 1, output_tokens: 80, cache_read_input_tokens: 10000 },
        { requestId: 'req_ts2', timestamp: '2026-03-20T11:00:05Z' },
      ),
    ].join('\n');

    const result = parseClaudeCodeSessionWithTimestamps(raw);
    const assistantMsg = result.messages.find((m) => m.role === 'assistant');

    expect(assistantMsg).toBeDefined();
    expect(assistantMsg!.content).toContain('Bash');
    expect(assistantMsg!.tokensUsed).toBe(10081);
  });

  it('skips system/command messages from user records', () => {
    const raw = [
      makeUserRecord(
        '<local-command-caveat>You are being asked to clear the conversation.</local-command-caveat>\n<command-name>clear</command-name>',
        { timestamp: '2026-03-20T10:00:00Z' },
      ),
      makeUserRecord('Real question here', { timestamp: '2026-03-20T10:01:00Z' }),
      makeAssistantRecord(
        [{ type: 'text', text: 'Answer' }],
        { input_tokens: 1, output_tokens: 10 },
        { requestId: 'req_ts3', timestamp: '2026-03-20T10:01:01Z' },
      ),
    ].join('\n');

    const result = parseClaudeCodeSessionWithTimestamps(raw);
    const userMessages = result.messages.filter((m) => m.role === 'user');

    expect(userMessages).toHaveLength(1);
    expect(userMessages[0]!.content).toBe('Real question here');
  });
});

describe('system message filtering', () => {
  it('skips /clear command messages in parseClaudeCodeSession', () => {
    const raw = [
      makeUserRecord(
        '<local-command-caveat>caveat</local-command-caveat>\n<command-name>clear</command-name>',
      ),
      makeUserRecord('Hello world'),
      makeAssistantRecord([{ type: 'text', text: 'Hi' }], { input_tokens: 1, output_tokens: 5 }),
    ].join('\n');

    const { parsed } = parseClaudeCodeSession(raw);
    const userMessages = parsed.messages.filter((m) => m.role === 'user');

    expect(userMessages).toHaveLength(1);
    expect(userMessages[0]!.content).toBe('Hello world');
  });

  it('keeps cleaned content when XML tags surround real text', () => {
    const raw = [
      makeUserRecord('<system-reminder>reminder</system-reminder> Fix the bug please'),
      makeAssistantRecord([{ type: 'text', text: 'Done' }], { input_tokens: 1, output_tokens: 5 }),
    ].join('\n');

    const { parsed } = parseClaudeCodeSession(raw);
    const userMsg = parsed.messages.find((m) => m.role === 'user');

    expect(userMsg!.content).toBe('Fix the bug please');
  });

  it('excludes system messages from messageCount in previewClaudeCodeSession', () => {
    const raw = [
      makeUserRecord('<command-name>clear</command-name>'),
      makeUserRecord('Real message'),
      makeAssistantRecord([{ type: 'text', text: 'Response' }], {
        input_tokens: 1,
        output_tokens: 5,
      }),
    ].join('\n');

    const result = previewClaudeCodeSession(raw);

    // 1 real user + 1 assistant = 2 (the system-only message is excluded)
    expect(result.messageCount).toBe(2);
  });

  it('throws when all messages are system messages', () => {
    const raw = [makeUserRecord('<command-name>clear</command-name>')].join('\n');

    expect(() => parseClaudeCodeSession(raw)).toThrow('No conversation messages found');
  });
});

describe('user content array handling', () => {
  it('extracts text from array content blocks in parseClaudeCodeSession', () => {
    const raw = [
      makeUserRecord([
        { type: 'image', source: { type: 'base64', data: 'abc' } },
        { type: 'text', text: 'What is in this image?' },
      ]),
      makeAssistantRecord([{ type: 'text', text: 'I see a cat.' }], {
        input_tokens: 10,
        output_tokens: 20,
      }),
    ].join('\n');

    const { parsed } = parseClaudeCodeSession(raw);
    const userMsg = parsed.messages.find((m) => m.role === 'user');

    expect(userMsg).toBeDefined();
    expect(userMsg!.content).toBe('What is in this image?');
  });

  it('joins multiple text blocks with double newline', () => {
    const raw = [
      makeUserRecord([
        { type: 'text', text: 'First paragraph' },
        { type: 'image', source: { type: 'base64', data: 'abc' } },
        { type: 'text', text: 'Second paragraph' },
      ]),
      makeAssistantRecord([{ type: 'text', text: 'Response' }], {
        input_tokens: 1,
        output_tokens: 5,
      }),
    ].join('\n');

    const { parsed } = parseClaudeCodeSession(raw);
    const userMsg = parsed.messages.find((m) => m.role === 'user');

    expect(userMsg!.content).toBe('First paragraph Second paragraph');
  });

  it('generates title from array content', () => {
    const raw = [
      makeUserRecord([
        { type: 'image', source: { type: 'base64', data: 'abc' } },
        { type: 'text', text: 'Describe the architecture in this diagram' },
      ]),
      makeAssistantRecord([{ type: 'text', text: 'The diagram shows...' }], {
        input_tokens: 1,
        output_tokens: 5,
      }),
    ].join('\n');

    const { parsed } = parseClaudeCodeSession(raw);
    expect(parsed.title).not.toBe('Untitled Session');
    expect(parsed.title.length).toBeGreaterThan(0);
  });

  it('skips image-only array content (no text blocks)', () => {
    const raw = [
      makeUserRecord([{ type: 'image', source: { type: 'base64', data: 'abc' } }]),
      makeUserRecord('Actual question'),
      makeAssistantRecord([{ type: 'text', text: 'Answer' }], {
        input_tokens: 1,
        output_tokens: 5,
      }),
    ].join('\n');

    const { parsed } = parseClaudeCodeSession(raw);
    const userMessages = parsed.messages.filter((m) => m.role === 'user');

    expect(userMessages).toHaveLength(1);
    expect(userMessages[0]!.content).toBe('Actual question');
  });

  it('handles array content in previewClaudeCodeSession', () => {
    const raw = [
      makeUserRecord([
        { type: 'image', source: { type: 'base64', data: 'abc' } },
        { type: 'text', text: 'Preview this image' },
      ]),
      makeAssistantRecord([{ type: 'text', text: 'I see...' }], {
        input_tokens: 1,
        output_tokens: 5,
      }),
    ].join('\n');

    const result = previewClaudeCodeSession(raw);

    expect(result.messageCount).toBe(2);
    expect(result.firstMessage).not.toBe('Empty session');
  });

  it('handles array content in parseClaudeCodeSessionWithTimestamps', () => {
    const raw = [
      makeUserRecord(
        [
          { type: 'image', source: { type: 'base64', data: 'abc' } },
          { type: 'text', text: 'Timestamp test with image' },
        ],
        { timestamp: '2026-03-20T10:00:00Z' },
      ),
      makeAssistantRecord(
        [{ type: 'text', text: 'Response' }],
        { input_tokens: 1, output_tokens: 5 },
        { requestId: 'req_arr', timestamp: '2026-03-20T10:00:01Z' },
      ),
    ].join('\n');

    const result = parseClaudeCodeSessionWithTimestamps(raw);
    const userMsg = result.messages.find((m) => m.role === 'user');

    expect(userMsg).toBeDefined();
    expect(userMsg!.content).toBe('Timestamp test with image');
    expect(userMsg!.timestamp).toBe('2026-03-20T10:00:00Z');
  });
});

describe('stripSystemXmlContent', () => {
  it('strips XML tags and returns remaining content', () => {
    expect(stripSystemXmlContent('<foo>bar</foo> hello')).toBe('hello');
  });

  it('returns empty string for XML-only content', () => {
    expect(stripSystemXmlContent('<command-name>clear</command-name>')).toBe('');
  });

  it('strips self-closing tags', () => {
    expect(stripSystemXmlContent('<br /> some text')).toBe('some text');
  });

  it('returns original content when no XML present', () => {
    expect(stripSystemXmlContent('plain text')).toBe('plain text');
  });

  it('collapses whitespace after stripping', () => {
    expect(stripSystemXmlContent('<tag>x</tag>  hello   world')).toBe('hello world');
  });
});
