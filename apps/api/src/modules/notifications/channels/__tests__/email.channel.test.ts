import { describe, it, expect } from 'vitest';
import { createEmailChannel, buildConflictEmailHtml } from '../email.channel.js';

describe('createEmailChannel', () => {
  it('should skip sending when no API key', async () => {
    const channel = createEmailChannel(undefined, 'noreply@test.com');
    // Should not throw
    await channel.send('user@test.com', 'Subject', '<p>Body</p>');
  });
});

describe('buildConflictEmailHtml', () => {
  it('should build HTML with critical severity color', () => {
    const html = buildConflictEmailHtml(
      'critical',
      'Conflict desc',
      'MyProject',
      'https://example.com/c/1',
    );

    expect(html).toContain('EF4444');
    expect(html).toContain('MyProject');
    expect(html).toContain('Conflict desc');
    expect(html).toContain('https://example.com/c/1');
  });

  it('should build HTML with warning severity color', () => {
    const html = buildConflictEmailHtml('warning', 'Desc', 'Proj', 'https://url');
    expect(html).toContain('F59E0B');
  });

  it('should build HTML with info severity color', () => {
    const html = buildConflictEmailHtml('info', 'Desc', 'Proj', 'https://url');
    expect(html).toContain('3B82F6');
  });

  it('should use gray fallback for unknown severity', () => {
    const html = buildConflictEmailHtml('unknown', 'Desc', 'Proj', 'https://url');
    expect(html).toContain('6B7280');
  });
});
