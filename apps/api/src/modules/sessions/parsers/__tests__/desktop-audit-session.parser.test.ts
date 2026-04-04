import { describe, it, expect } from 'vitest';
import {
  parseDesktopAuditSession,
  parseDesktopAuditSessionWithTimestamps,
} from '../desktop-audit-session.parser.js';

// Desktop audit log uses Claude Code JSONL format with _audit_timestamp
const makeUserLine = (content: string) =>
  JSON.stringify({
    type: 'user',
    message: { role: 'user', content },
    _audit_timestamp: '2025-01-01T10:00:00Z',
    _audit_hmac: 'hmac123',
  });

const makeAssistantLine = (content: string) =>
  JSON.stringify({
    type: 'assistant',
    message: { role: 'assistant', content: [{ type: 'text', text: content }], model: 'claude-3' },
    _audit_timestamp: '2025-01-01T10:01:00Z',
    _audit_hmac: 'hmac456',
  });

describe('parseDesktopAuditSession', () => {
  it('should parse user and assistant messages', () => {
    const raw = [makeUserLine('Hello'), makeAssistantLine('Hi there!')].join('\n');

    const result = parseDesktopAuditSession(raw);

    expect(result.parsed.source).toBe('claude_ai');
    expect(result.parsed.messages.length).toBeGreaterThanOrEqual(1);
  });

  it('should skip rate_limit_event records', () => {
    const raw = [
      JSON.stringify({
        type: 'rate_limit_event',
        _audit_timestamp: '2025-01-01T00:00:00Z',
        _audit_hmac: 'x',
      }),
      makeUserLine('Real message'),
      makeAssistantLine('Response'),
    ].join('\n');

    const result = parseDesktopAuditSession(raw);
    expect(result.parsed.source).toBe('claude_ai');
  });

  it('should skip result records', () => {
    const raw = [
      JSON.stringify({
        type: 'result',
        _audit_timestamp: '2025-01-01T00:00:00Z',
        _audit_hmac: 'x',
      }),
      makeUserLine('Hello'),
      makeAssistantLine('Response'),
    ].join('\n');

    const result = parseDesktopAuditSession(raw);
    expect(result.parsed.source).toBe('claude_ai');
  });

  it('should skip permission_request system records', () => {
    const raw = [
      JSON.stringify({
        type: 'system',
        subtype: 'permission_request',
        _audit_timestamp: '2025-01-01T00:00:00Z',
        _audit_hmac: 'x',
      }),
      makeUserLine('Hello'),
      makeAssistantLine('Response'),
    ].join('\n');

    const result = parseDesktopAuditSession(raw);
    expect(result.parsed.source).toBe('claude_ai');
  });

  it('should use metadataTitle when provided', () => {
    const raw = [makeUserLine('Hi'), makeAssistantLine('Hello')].join('\n');
    const result = parseDesktopAuditSession(raw, 'Custom Title');

    expect(result.parsed.title).toBe('Custom Title');
  });
});

describe('parseDesktopAuditSessionWithTimestamps', () => {
  it('should return timestamped result', () => {
    const raw = [makeUserLine('Hello'), makeAssistantLine('Hi')].join('\n');
    const result = parseDesktopAuditSessionWithTimestamps(raw);

    expect(result.messages).toBeDefined();
  });

  it('should use metadataTitle when provided', () => {
    const raw = [makeUserLine('Hi'), makeAssistantLine('Hello')].join('\n');
    const result = parseDesktopAuditSessionWithTimestamps(raw, 'Title');

    expect(result.title).toBe('Title');
  });
});
