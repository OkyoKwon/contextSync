import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSlackChannel, buildConflictSlackMessage } from '../slack.channel.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createSlackChannel', () => {
  it('should skip when no webhook URL', async () => {
    const channel = createSlackChannel();
    await channel.send('', { text: 'test' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should send message to webhook', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const channel = createSlackChannel();
    await channel.send('https://hooks.slack.com/test', { text: 'hello' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'hello' }),
      }),
    );
  });

  it('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    const channel = createSlackChannel();

    await expect(channel.send('https://hooks.slack.com/test', { text: 'hello' })).rejects.toThrow(
      'Slack webhook failed: 500',
    );
  });
});

describe('buildConflictSlackMessage', () => {
  it('should build message with emoji for critical', () => {
    const msg = buildConflictSlackMessage('critical', 'Desc', 'Project', 'https://url');
    expect(msg.text).toContain(':rotating_light:');
    expect(msg.text).toContain('Project');
  });

  it('should build message with emoji for warning', () => {
    const msg = buildConflictSlackMessage('warning', 'Desc', 'Proj', 'https://url');
    expect(msg.text).toContain(':warning:');
  });

  it('should build message with emoji for info', () => {
    const msg = buildConflictSlackMessage('info', 'Desc', 'Proj', 'https://url');
    expect(msg.text).toContain(':information_source:');
  });

  it('should use fallback emoji for unknown severity', () => {
    const msg = buildConflictSlackMessage('other', 'Desc', 'Proj', 'https://url');
    expect(msg.text).toContain(':grey_question:');
  });

  it('should include blocks with button', () => {
    const msg = buildConflictSlackMessage('info', 'Desc', 'Proj', 'https://url');
    expect(msg.blocks).toBeDefined();
    expect(msg.blocks!.length).toBeGreaterThan(0);
  });
});
