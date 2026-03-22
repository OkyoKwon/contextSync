import { describe, it, expect } from 'vitest';
import { validateSessionImport } from '../session.validator.js';

describe('validateSessionImport', () => {
  const validMessage = { role: 'user', content: 'Hello' };
  const validInput = { title: 'Test Session', messages: [validMessage] };

  it('should accept valid minimal input (title + messages)', () => {
    const result = validateSessionImport(validInput);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.data).toBeDefined();
    expect(result.data?.title).toBe('Test Session');
    expect(result.data?.messages).toHaveLength(1);
  });

  it('should accept valid input with all optional fields and preserve data', () => {
    const input = {
      title: 'Full Session',
      source: 'claude_code',
      branch: 'main',
      tags: ['tag1', 'tag2'],
      messages: [
        {
          role: 'user',
          content: 'Hello',
          contentType: 'prompt',
          tokensUsed: 100,
          modelUsed: 'claude-sonnet-4',
        },
      ],
    };
    const result = validateSessionImport(input);
    expect(result.valid).toBe(true);
    expect(result.data?.source).toBe('claude_code');
    expect(result.data?.branch).toBe('main');
    expect(result.data?.tags).toEqual(['tag1', 'tag2']);
    expect(result.data?.messages[0]!.contentType).toBe('prompt');
    expect(result.data?.messages[0]!.tokensUsed).toBe(100);
    expect(result.data?.messages[0]!.modelUsed).toBe('claude-sonnet-4');
  });

  it('should reject null input', () => {
    const result = validateSessionImport(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Input must be an object');
  });

  it('should reject undefined input', () => {
    const result = validateSessionImport(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Input must be an object');
  });

  it('should reject non-object input (string)', () => {
    const result = validateSessionImport('not an object');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Input must be an object');
  });

  it('should reject missing title', () => {
    const result = validateSessionImport({ messages: [validMessage] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('title is required and must be a string');
  });

  it('should reject empty string title', () => {
    const result = validateSessionImport({ title: '', messages: [validMessage] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('title is required and must be a string');
  });

  it('should reject invalid source', () => {
    const result = validateSessionImport({
      title: 'Test',
      source: 'invalid_source',
      messages: [validMessage],
    });
    expect(result.valid).toBe(false);
    const sourceError = result.errors.find((e) => e.includes('source must be one of'));
    expect(sourceError).toBeDefined();
    expect(sourceError).toContain('claude_code');
  });

  it('should accept valid source (claude_code)', () => {
    const result = validateSessionImport({
      title: 'Test',
      source: 'claude_code',
      messages: [validMessage],
    });
    expect(result.valid).toBe(true);
  });

  it('should reject missing messages', () => {
    const result = validateSessionImport({ title: 'Test' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('messages must be a non-empty array');
  });

  it('should reject empty messages array', () => {
    const result = validateSessionImport({ title: 'Test', messages: [] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('messages must be a non-empty array');
  });

  it('should reject message missing role with index', () => {
    const result = validateSessionImport({
      title: 'Test',
      messages: [{ content: 'Hello' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('messages[0].role is required and must be a string');
  });

  it('should reject message missing content with index', () => {
    const result = validateSessionImport({
      title: 'Test',
      messages: [{ role: 'user' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('messages[0].content is required and must be a string');
  });

  it('should reject null message', () => {
    const result = validateSessionImport({
      title: 'Test',
      messages: [null],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('messages[0] must be an object');
  });

  it('should accumulate multiple errors', () => {
    const result = validateSessionImport({
      source: 'bad_source',
      messages: [{ role: '', content: '' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
    expect(result.errors).toContain('title is required and must be a string');
    expect(result.errors.some((e) => e.includes('source must be one of'))).toBe(true);
  });
});
