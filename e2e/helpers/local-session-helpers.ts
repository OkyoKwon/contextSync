import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CLAUDE_PROJECTS_DIR = join(homedir(), '.claude', 'projects');

export function encodeProjectPath(absolutePath: string): string {
  return absolutePath.replace(/\//g, '-');
}

export function createLocalSessionFile(
  projectPath: string,
  sessionId: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
): string {
  const encodedDir = encodeProjectPath(projectPath);
  const dirPath = join(CLAUDE_PROJECTS_DIR, encodedDir);
  mkdirSync(dirPath, { recursive: true });

  const filePath = join(dirPath, `${sessionId}.jsonl`);
  const content = messages
    .map((m, i) => {
      if (m.role === 'user') {
        return JSON.stringify({
          type: 'user',
          message: { role: 'user', content: m.content },
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
        });
      }
      return JSON.stringify({
        type: 'assistant',
        requestId: `req-${sessionId}-${i}`,
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: m.content }],
          model: 'claude-sonnet-4-20250514',
          usage: { input_tokens: 100, output_tokens: 50 },
        },
      });
    })
    .join('\n');

  writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

export function cleanupLocalSessionDir(projectPath: string): void {
  const encodedDir = encodeProjectPath(projectPath);
  const dirPath = join(CLAUDE_PROJECTS_DIR, encodedDir);
  if (existsSync(dirPath)) {
    rmSync(dirPath, { recursive: true, force: true });
  }
}
