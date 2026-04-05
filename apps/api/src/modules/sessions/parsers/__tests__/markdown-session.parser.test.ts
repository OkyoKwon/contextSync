import { describe, it, expect } from 'vitest';
import { parseMarkdownSession } from '../markdown-session.parser.js';

describe('parseMarkdownSession', () => {
  it('should parse header-based markdown format', () => {
    const md = '## User\nHello, can you help me?\n\n## Assistant\nOf course! What do you need?';

    const result = parseMarkdownSession(md);

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]!.role).toBe('user');
    expect(result.messages[0]!.content).toContain('Hello');
    expect(result.messages[1]!.role).toBe('assistant');
  });

  it('should parse Human/AI role variants', () => {
    const md = '## Human\nHi\n\n## AI\nHello!';

    const result = parseMarkdownSession(md);

    expect(result.messages[0]!.role).toBe('user');
    expect(result.messages[1]!.role).toBe('assistant');
  });

  it('should parse fallback bold format', () => {
    const md = '**User:** What is TypeScript?\n**Assistant:** TypeScript is...';

    const result = parseMarkdownSession(md);

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]!.role).toBe('user');
    expect(result.messages[1]!.role).toBe('assistant');
  });

  it('should extract title from H1', () => {
    const md = '# My Session\n\n## User\nHi\n\n## Assistant\nHello';

    const result = parseMarkdownSession(md);

    expect(result.title).toBe('My Session');
  });

  it('should generate title from first message when no H1', () => {
    const md = '## User\nThis is my first message about testing\n\n## Assistant\nSure!';

    const result = parseMarkdownSession(md);

    expect(result.title).toBeDefined();
    expect(result.title.length).toBeGreaterThan(0);
  });

  it('should throw when no conversation blocks found', () => {
    expect(() => parseMarkdownSession('')).toThrow('No conversation blocks found');
  });

  it('should set contentType based on role', () => {
    const md = '## User\nQuestion\n\n## Assistant\nAnswer';

    const result = parseMarkdownSession(md);

    expect(result.messages[0]!.contentType).toBe('prompt');
    expect(result.messages[1]!.contentType).toBe('response');
  });

  it('should handle Bot role variant', () => {
    const md = '## User\nHi\n\n## Bot\nHello!';

    const result = parseMarkdownSession(md);

    expect(result.messages[1]!.role).toBe('assistant');
  });
});
