import { describe, expect, it } from 'vitest';
import { findFirstMeaningfulTitle, generateTitle } from '../title.utils.js';

describe('generateTitle', () => {
  it('should strip XML tags and their content', () => {
    const input =
      '<local-command-caveat>Caveat: The messages below may reference tools.</local-command-caveat>Fix the login bug';
    expect(generateTitle(input)).toBe('Fix the login bug');
  });

  it('should strip self-closing and nested XML tags', () => {
    const input = '<system-reminder>Some system info</system-reminder>Refactor the auth module';
    expect(generateTitle(input)).toBe('Refactor the auth module');
  });

  it('should strip command-name tags', () => {
    const input =
      '<command-name>commit</command-name><command-message>Create a commit</command-message>Add tests for utils';
    expect(generateTitle(input)).toBe('Add tests for utils');
  });

  it('should extract plan name from markdown header', () => {
    const input =
      'Implement the following plan:\n\n# Plan: Remove "Show All" filter\n\n## Context\n\nSome details here';
    expect(generateTitle(input)).toBe('Remove "Show All" filter');
  });

  it('should extract plan name without "Plan:" prefix', () => {
    const input =
      'Implement the following plan:\n\n# Improve Session Title Generation\n\n## Context';
    expect(generateTitle(input)).toBe('Improve Session Title Generation');
  });

  it('should strip boilerplate prefixes', () => {
    expect(generateTitle('Please fix the login bug')).toBe('fix the login bug');
    expect(generateTitle('Can you help me refactor this?')).toBe('help me refactor this?');
    expect(generateTitle('I want you to add dark mode')).toBe('add dark mode');
    expect(generateTitle('I need you to update the API')).toBe('update the API');
  });

  it('should strip "Implement the following plan:" without a markdown header', () => {
    const input = 'Implement the following plan: add caching to the search endpoint';
    expect(generateTitle(input)).toBe('add caching to the search endpoint');
  });

  it('should collapse whitespace and trim', () => {
    const input = '  Fix   the\n\n  login    bug  ';
    expect(generateTitle(input)).toBe('Fix the login bug');
  });

  it('should truncate at word boundary at 100 chars', () => {
    const input =
      'Implement a comprehensive authentication system with OAuth2 support including Google GitHub and Microsoft providers with proper token refresh';
    const result = generateTitle(input);
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result).not.toMatch(/\s$/);
    // Should not cut mid-word
    expect(result.endsWith('...')).toBe(false);
    expect(input.startsWith(result)).toBe(true);
  });

  it('should return "Untitled Session" for empty input', () => {
    expect(generateTitle('')).toBe('Untitled Session');
    expect(generateTitle('   ')).toBe('Untitled Session');
    expect(generateTitle('\n\n')).toBe('Untitled Session');
  });

  it('should return "Untitled Session" when only XML tags remain', () => {
    expect(generateTitle('<system-reminder>Only system content</system-reminder>')).toBe(
      'Untitled Session',
    );
  });

  it('should handle normal short messages unchanged', () => {
    expect(generateTitle('Fix the login bug')).toBe('Fix the login bug');
  });

  it('should handle messages with mixed XML and useful content', () => {
    const input =
      '<local-command-caveat>Some caveat</local-command-caveat>\n\nAdd pagination to the sessions list';
    expect(generateTitle(input)).toBe('Add pagination to the sessions list');
  });

  it('should strip boilerplate prefix after XML tag removal', () => {
    const input = '<system-reminder>Info</system-reminder>Please add pagination';
    expect(generateTitle(input)).toBe('add pagination');
  });

  it('should handle plan with "Plan:" prefix in header', () => {
    const input =
      'Implement the following plan:\n\n# Plan: CLAUDE.md 작성\n\n## Context\nSome context';
    expect(generateTitle(input)).toBe('CLAUDE.md 작성');
  });

  it('should strip markdown header prefixes from non-plan content', () => {
    expect(generateTitle('# Fix login bug')).toBe('Fix login bug');
    expect(generateTitle('## Refactor auth module')).toBe('Refactor auth module');
    expect(generateTitle('### Add dark mode support')).toBe('Add dark mode support');
  });

  it('should handle content that is exactly 100 chars', () => {
    const input = 'A'.repeat(100);
    expect(generateTitle(input)).toBe(input);
  });

  it('should handle content shorter than 100 chars', () => {
    const input = 'Short message';
    expect(generateTitle(input)).toBe('Short message');
  });
});

describe('findFirstMeaningfulTitle', () => {
  it('should skip XML-only messages and use the first meaningful one', () => {
    const contents = [
      '<local-command-caveat>Caveat text</local-command-caveat>',
      '<command-name>/clear</command-name><command-message>clear</command-message><command-args></command-args>',
      'PRD 문서를 넣으면 현재 작성된 코드베이스 기반으로 Achievement Rate 를 측정할 수 있는 기능을 만들고 싶어',
    ];
    expect(findFirstMeaningfulTitle(contents)).toBe(
      'PRD 문서를 넣으면 현재 작성된 코드베이스 기반으로 Achievement Rate 를 측정할 수 있는 기능을 만들고 싶어',
    );
  });

  it('should return Untitled Session if all messages are system content', () => {
    const contents = [
      '<system-reminder>Only system</system-reminder>',
      '<command-name>/clear</command-name>',
    ];
    expect(findFirstMeaningfulTitle(contents)).toBe('Untitled Session');
  });

  it('should return Untitled Session for empty array', () => {
    expect(findFirstMeaningfulTitle([])).toBe('Untitled Session');
  });

  it('should use the first meaningful message, not the last', () => {
    const contents = [
      '<system-reminder>system</system-reminder>',
      'First real message',
      'Second real message',
    ];
    expect(findFirstMeaningfulTitle(contents)).toBe('First real message');
  });
});
