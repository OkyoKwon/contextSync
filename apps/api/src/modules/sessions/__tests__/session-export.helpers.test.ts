import { describe, it, expect } from 'vitest';
import { roleHeading, sessionToMarkdown } from '../session-export.helpers.js';

describe('roleHeading', () => {
  it('returns "User" for "user"', () => {
    expect(roleHeading('user')).toBe('User');
  });

  it('returns "User" for "human"', () => {
    expect(roleHeading('human')).toBe('User');
  });

  it('returns "Assistant" for "assistant"', () => {
    expect(roleHeading('assistant')).toBe('Assistant');
  });

  it('capitalizes first letter for unmapped role "system"', () => {
    expect(roleHeading('system')).toBe('System');
  });

  it('capitalizes first letter only for "custom_role"', () => {
    expect(roleHeading('custom_role')).toBe('Custom_role');
  });
});

describe('sessionToMarkdown', () => {
  it('builds correct markdown with title, metadata, and messages', () => {
    const session = {
      title: 'Test Session',
      createdAt: '2024-01-01T00:00:00.000Z',
      source: 'claude_code',
      branch: 'main',
      filePaths: ['src/index.ts'],
    } as any;
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ] as any;

    const md = sessionToMarkdown(session, messages);

    expect(md).toContain('## Test Session');
    expect(md).toContain('- **Source**: claude_code');
    expect(md).toContain('- **Branch**: main');
    expect(md).toContain('- **Files**: src/index.ts');
    expect(md).toContain('### User');
    expect(md).toContain('Hello');
    expect(md).toContain('### Assistant');
    expect(md).toContain('Hi there');
  });
});
