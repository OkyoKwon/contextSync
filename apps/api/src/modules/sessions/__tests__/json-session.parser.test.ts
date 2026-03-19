import { describe, it, expect } from 'vitest';
import { parseJsonSession, parseJsonlSession, extractFilePathsFromMessages } from '../parsers/json-session.parser.js';

describe('parseJsonSession', () => {
  it('should parse a valid JSON session with messages', () => {
    const input = JSON.stringify({
      title: 'Test Session',
      source: 'claude_code',
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ],
    });

    const result = parseJsonSession(input);

    expect(result.title).toBe('Test Session');
    expect(result.source).toBe('claude_code');
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]!.role).toBe('user');
    expect(result.messages[1]!.role).toBe('assistant');
  });

  it('should handle conversation key instead of messages', () => {
    const input = JSON.stringify({
      title: 'Test',
      conversation: [
        { role: 'human', content: 'Hi' },
        { role: 'ai', content: 'Hello' },
      ],
    });

    const result = parseJsonSession(input);

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]!.role).toBe('user');
    expect(result.messages[1]!.role).toBe('assistant');
  });

  it('should derive title from first message when title is missing', () => {
    const input = JSON.stringify({
      messages: [{ role: 'user', content: 'Implement login feature' }],
    });

    const result = parseJsonSession(input);

    expect(result.title).toBe('Implement login feature');
  });

  it('should throw on empty messages', () => {
    const input = JSON.stringify({ messages: [] });
    expect(() => parseJsonSession(input)).toThrow('No messages found');
  });
});

describe('parseJsonlSession', () => {
  it('should parse JSONL format', () => {
    const input = [
      JSON.stringify({ role: 'user', content: 'Hello' }),
      JSON.stringify({ role: 'assistant', content: 'Hi' }),
    ].join('\n');

    const result = parseJsonlSession(input);

    expect(result.messages).toHaveLength(2);
  });
});

describe('extractFilePathsFromMessages', () => {
  it('should extract file paths from message content', () => {
    const messages = [
      { content: 'Please update src/components/Button.tsx and src/utils/format.ts' },
    ];

    const paths = extractFilePathsFromMessages(messages);

    expect(paths).toContain('src/components/Button.tsx');
    expect(paths).toContain('src/utils/format.ts');
  });

  it('should deduplicate paths', () => {
    const messages = [
      { content: 'Edit src/app.ts' },
      { content: 'Also modify src/app.ts' },
    ];

    const paths = extractFilePathsFromMessages(messages);

    expect(paths.filter((p) => p === 'src/app.ts')).toHaveLength(1);
  });

  it('should not extract non-file strings', () => {
    const messages = [{ content: 'This is a simple message without files' }];

    const paths = extractFilePathsFromMessages(messages);

    expect(paths).toHaveLength(0);
  });
});
