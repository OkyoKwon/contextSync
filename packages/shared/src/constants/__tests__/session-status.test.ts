import { describe, it, expect } from 'vitest';
import {
  SESSION_SOURCES,
  SESSION_STATUSES,
  MESSAGE_ROLES,
  MESSAGE_CONTENT_TYPES,
} from '../session-status.js';

describe('SESSION_SOURCES', () => {
  it('should contain all expected sources', () => {
    expect(SESSION_SOURCES).toContain('claude_code');
    expect(SESSION_SOURCES).toContain('claude_ai');
    expect(SESSION_SOURCES).toContain('api');
    expect(SESSION_SOURCES).toContain('manual');
  });
});

describe('SESSION_STATUSES', () => {
  it('should contain all expected statuses', () => {
    expect(SESSION_STATUSES).toContain('active');
    expect(SESSION_STATUSES).toContain('completed');
    expect(SESSION_STATUSES).toContain('archived');
  });
});

describe('MESSAGE_ROLES', () => {
  it('should contain user and assistant', () => {
    expect(MESSAGE_ROLES).toContain('user');
    expect(MESSAGE_ROLES).toContain('assistant');
  });
});

describe('MESSAGE_CONTENT_TYPES', () => {
  it('should contain all expected content types', () => {
    expect(MESSAGE_CONTENT_TYPES).toContain('prompt');
    expect(MESSAGE_CONTENT_TYPES).toContain('response');
    expect(MESSAGE_CONTENT_TYPES).toContain('plan');
  });
});
