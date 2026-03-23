import { describe, expect, it } from 'vitest';
import {
  extractAssistantIntent,
  findFirstMeaningfulTitle,
  generateSessionTitle,
  generateTitle,
  humanizeBranchName,
  isVagueMessage,
  scoreTitleCandidate,
  summarizeFilePaths,
  UNTITLED,
} from '../title.utils.js';

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

  it('should strip bracket-wrapped system interruption messages', () => {
    expect(generateTitle('[Request interrupted by user for tool use]')).toBe('Untitled Session');
    expect(generateTitle('[Request interrupted by user]')).toBe('Untitled Session');
  });

  it('should strip interruption message and keep real content', () => {
    const input = '[Request interrupted by user for tool use] Fix the login bug';
    expect(generateTitle(input)).toBe('Fix the login bug');
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

  it('should strip # after XML removal leaves leading whitespace', () => {
    const input = '<system-reminder>Info</system-reminder>\n# Fix login bug';
    expect(generateTitle(input)).toBe('Fix login bug');
  });

  it('should handle plan detection after XML removal', () => {
    const input =
      '<system-reminder>Info</system-reminder>\nImplement the following plan:\n\n# Plan: My Feature\n\n## Context';
    expect(generateTitle(input)).toBe('My Feature');
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

  it('should skip interruption-only messages and use the first meaningful one', () => {
    const contents = ['[Request interrupted by user for tool use]', 'Real user question'];
    expect(findFirstMeaningfulTitle(contents)).toBe('Real user question');
  });

  it('should return Untitled Session if all messages are interruptions', () => {
    const contents = [
      '[Request interrupted by user for tool use]',
      '[Request interrupted by user]',
    ];
    expect(findFirstMeaningfulTitle(contents)).toBe('Untitled Session');
  });
});

describe('isVagueMessage', () => {
  it('detects single vague words', () => {
    expect(isVagueMessage('yes')).toBe(true);
    expect(isVagueMessage('y')).toBe(true);
    expect(isVagueMessage('ok')).toBe(true);
    expect(isVagueMessage('sure')).toBe(true);
    expect(isVagueMessage('commit')).toBe(true);
    expect(isVagueMessage('thanks')).toBe(true);
    expect(isVagueMessage('lgtm')).toBe(true);
  });

  it('detects Korean vague words', () => {
    expect(isVagueMessage('ㅇㅇ')).toBe(true);
    expect(isVagueMessage('ㅇㅋ')).toBe(true);
    expect(isVagueMessage('이거')).toBe(true);
    expect(isVagueMessage('해줘')).toBe(true);
    expect(isVagueMessage('고쳐')).toBe(true);
    expect(isVagueMessage('확인')).toBe(true);
  });

  it('detects stack traces', () => {
    const stackTrace = `Error: Cannot read properties of undefined
    at Object.<anonymous> (/app/src/index.ts:42:5)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)`;
    expect(isVagueMessage(stackTrace)).toBe(true);
  });

  it('detects short messages without verbs', () => {
    expect(isVagueMessage('this file')).toBe(true);
    expect(isVagueMessage('the bug')).toBe(true);
  });

  it('does not flag meaningful messages', () => {
    expect(isVagueMessage('fix the login bug')).toBe(false);
    expect(isVagueMessage('Add dark mode support to the settings page')).toBe(false);
    expect(isVagueMessage('Refactor the auth middleware')).toBe(false);
  });

  it('does not flag short messages with action verbs', () => {
    expect(isVagueMessage('fix this bug')).toBe(false);
    expect(isVagueMessage('add tests')).toBe(false);
  });

  it('treats empty string as vague', () => {
    expect(isVagueMessage('')).toBe(true);
    expect(isVagueMessage('   ')).toBe(true);
  });
});

describe('scoreTitleCandidate', () => {
  it('gives high score to plan titles', () => {
    const plan = 'Implement the following plan:\n\n# Plan: Auth Middleware Refactor\n\n## Context';
    expect(scoreTitleCandidate(plan)).toBeGreaterThanOrEqual(5);
  });

  it('gives positive score to action verb messages', () => {
    expect(scoreTitleCandidate('Fix the login validation bug')).toBeGreaterThan(0);
    expect(scoreTitleCandidate('Add dark mode support')).toBeGreaterThan(0);
    expect(scoreTitleCandidate('Refactor the session parser')).toBeGreaterThan(0);
  });

  it('gives bonus for good length range', () => {
    const short = 'fix bug'; // < 15
    const good = 'Fix the authentication middleware to handle expired tokens';
    expect(scoreTitleCandidate(good)).toBeGreaterThan(scoreTitleCandidate(short));
  });

  it('penalizes vague messages heavily', () => {
    expect(scoreTitleCandidate('yes')).toBeLessThan(0);
    expect(scoreTitleCandidate('ok')).toBeLessThan(0);
    expect(scoreTitleCandidate('ㅇㅇ')).toBeLessThan(0);
  });

  it('penalizes very long pastes', () => {
    const longPaste = 'fix ' + 'a'.repeat(250);
    const normalMsg = 'Fix the authentication middleware';
    expect(scoreTitleCandidate(normalMsg)).toBeGreaterThan(scoreTitleCandidate(longPaste));
  });

  it('returns negative for untitled content', () => {
    expect(scoreTitleCandidate('')).toBeLessThan(0);
    expect(scoreTitleCandidate('<system-reminder>only xml</system-reminder>')).toBeLessThan(0);
  });
});

describe('humanizeBranchName', () => {
  it('removes feat/ prefix and humanizes', () => {
    expect(humanizeBranchName('feat/add-dark-mode')).toBe('Add dark mode');
  });

  it('removes fix/ prefix', () => {
    expect(humanizeBranchName('fix/login-validation')).toBe('Login validation');
  });

  it('removes refactor/ prefix', () => {
    expect(humanizeBranchName('refactor/auth-middleware')).toBe('Auth middleware');
  });

  it('removes ticket numbers as prefix', () => {
    expect(humanizeBranchName('feat/PROJ-123-add-dark-mode')).toBe('Add dark mode');
  });

  it('removes ticket numbers as suffix', () => {
    expect(humanizeBranchName('feat/add-dark-mode-PROJ-456')).toBe('Add dark mode');
  });

  it('returns null for default branches', () => {
    expect(humanizeBranchName('main')).toBeNull();
    expect(humanizeBranchName('master')).toBeNull();
    expect(humanizeBranchName('develop')).toBeNull();
    expect(humanizeBranchName('dev')).toBeNull();
  });

  it('handles underscores', () => {
    expect(humanizeBranchName('feat/add_dark_mode')).toBe('Add dark mode');
  });

  it('returns null for empty string', () => {
    expect(humanizeBranchName('')).toBeNull();
    expect(humanizeBranchName('  ')).toBeNull();
  });

  it('handles branch without prefix', () => {
    expect(humanizeBranchName('add-dark-mode')).toBe('Add dark mode');
  });
});

describe('extractAssistantIntent', () => {
  it('extracts "I\'ll" pattern', () => {
    expect(extractAssistantIntent("I'll fix the authentication middleware for you.")).toBe(
      'Fix the authentication middleware for you',
    );
  });

  it('extracts "Let me" pattern', () => {
    expect(extractAssistantIntent('Let me refactor the session parser.')).toBe(
      'Refactor the session parser',
    );
  });

  it('extracts "I\'m going to" pattern', () => {
    expect(extractAssistantIntent("I'm going to add dark mode support.")).toBe(
      'Add dark mode support',
    );
  });

  it('returns null for non-matching text', () => {
    expect(extractAssistantIntent('The code looks good.')).toBeNull();
    expect(extractAssistantIntent('Here is the result.')).toBeNull();
  });

  it('returns null for empty text', () => {
    expect(extractAssistantIntent('')).toBeNull();
  });

  it('only uses first sentence (stops at period)', () => {
    expect(extractAssistantIntent("I'll fix the bug. Then I'll add tests.")).toBe('Fix the bug');
  });

  it('only uses first line (stops at newline)', () => {
    expect(extractAssistantIntent('Let me check the code\nFirst, I need to read the file')).toBe(
      'Check the code',
    );
  });
});

describe('summarizeFilePaths', () => {
  it('returns null for empty array', () => {
    expect(summarizeFilePaths([])).toBeNull();
  });

  it('returns last 2 segments for single file', () => {
    expect(summarizeFilePaths(['src/modules/auth/login.ts'])).toBe('auth/login.ts');
  });

  it('summarizes multiple files in same module', () => {
    const paths = [
      'src/modules/auth/login.ts',
      'src/modules/auth/register.ts',
      'src/modules/auth/middleware.ts',
    ];
    expect(summarizeFilePaths(paths)).toBe('3 files in auth');
  });

  it('summarizes files across modules', () => {
    const paths = [
      'src/modules/auth/login.ts',
      'src/modules/auth/register.ts',
      'src/modules/sessions/parser.ts',
      'src/modules/sessions/service.ts',
      'src/components/layout/Sidebar.tsx',
    ];
    expect(summarizeFilePaths(paths)).toBe('5 files across auth, sessions');
  });

  it('handles component paths', () => {
    const paths = [
      'src/components/settings/IntegrationsTab.tsx',
      'src/components/settings/ProfileTab.tsx',
    ];
    expect(summarizeFilePaths(paths)).toBe('2 files in settings');
  });

  it('handles files with no recognized module pattern', () => {
    const paths = ['README.md', 'package.json', 'tsconfig.json'];
    expect(summarizeFilePaths(paths)).toBe('3 files');
  });
});

describe('generateSessionTitle', () => {
  it('uses good first user message directly', () => {
    const result = generateSessionTitle({
      userMessages: ['Fix the authentication middleware'],
      assistantMessages: ["I'll fix the auth middleware."],
      filePaths: [],
      toolNames: [],
    });
    expect(result).toBe('Fix the authentication middleware');
  });

  it('picks best scoring message when first is vague', () => {
    const result = generateSessionTitle({
      userMessages: ['yes', 'Fix the login validation bug'],
      assistantMessages: [],
      filePaths: [],
      toolNames: [],
    });
    expect(result).toBe('Fix the login validation bug');
  });

  it('falls back to assistant intent when all user messages are vague', () => {
    const result = generateSessionTitle({
      userMessages: ['yes', 'ok', 'sure'],
      assistantMessages: ["I'll refactor the session parser."],
      filePaths: [],
      toolNames: [],
    });
    expect(result).toBe('Refactor the session parser');
  });

  it('falls back to branch name when all messages are vague and no assistant intent', () => {
    const result = generateSessionTitle({
      userMessages: ['yes'],
      assistantMessages: ['Done.'],
      branch: 'feat/add-dark-mode',
      filePaths: [],
      toolNames: [],
    });
    expect(result).toBe('Add dark mode');
  });

  it('returns Untitled Session as final fallback', () => {
    const result = generateSessionTitle({
      userMessages: ['yes'],
      assistantMessages: ['Done.'],
      filePaths: [],
      toolNames: [],
    });
    expect(result).toBe(UNTITLED);
  });

  it('adds file path suffix for short titles', () => {
    const result = generateSessionTitle({
      userMessages: ['Fix the bug'],
      assistantMessages: [],
      filePaths: ['src/modules/auth/login.ts', 'src/modules/auth/middleware.ts'],
      toolNames: [],
    });
    expect(result).toContain('Fix the bug');
    expect(result).toContain('auth');
  });

  it('does not add suffix when title would exceed max length', () => {
    const longTitle = 'Implement comprehensive authentication system with OAuth2 support';
    const result = generateSessionTitle({
      userMessages: [longTitle],
      assistantMessages: [],
      filePaths: ['src/modules/auth/very-long-path/some-deeply-nested-file.ts'],
      toolNames: [],
    });
    // Should still contain the title, may or may not have suffix depending on length
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('handles plan titles with high priority', () => {
    const result = generateSessionTitle({
      userMessages: [
        'Implement the following plan:\n\n# Plan: Auth Middleware Refactor\n\n## Context',
      ],
      assistantMessages: [],
      filePaths: [],
      toolNames: [],
    });
    expect(result).toBe('Auth Middleware Refactor');
  });

  it('handles empty user messages', () => {
    const result = generateSessionTitle({
      userMessages: [],
      assistantMessages: ["I'll help you."],
      filePaths: [],
      toolNames: [],
    });
    expect(result).toBe('Help you');
  });

  it('handles branch fallback with file suffix', () => {
    const result = generateSessionTitle({
      userMessages: ['ok'],
      assistantMessages: ['Done.'],
      branch: 'fix/login-bug',
      filePaths: ['src/modules/auth/login.ts'],
      toolNames: [],
    });
    expect(result).toContain('Login bug');
    expect(result).toContain('auth/login.ts');
  });

  it('skips default branches for fallback', () => {
    const result = generateSessionTitle({
      userMessages: ['yes'],
      assistantMessages: ['OK.'],
      branch: 'main',
      filePaths: [],
      toolNames: [],
    });
    expect(result).toBe(UNTITLED);
  });
});
