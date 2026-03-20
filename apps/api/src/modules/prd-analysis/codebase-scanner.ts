import { readFile, readdir, stat } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';

const SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java',
  '.css', '.html', '.sql', '.json', '.yaml', '.yml', '.toml',
  '.svelte', '.vue', '.rb', '.php', '.swift', '.kt',
]);

const EXCLUDED_DIRS = new Set([
  'node_modules', 'dist', 'build', '.git', 'coverage',
  '.next', '.nuxt', '.output', '__pycache__', '.venv',
  'venv', 'target', '.cache', '.turbo', '.vercel',
]);

const PRIORITY_FILES = new Set([
  'package.json', 'tsconfig.json', 'pyproject.toml',
  'Cargo.toml', 'go.mod', 'pom.xml', 'build.gradle',
]);

const MAX_FILES = 500;
const MAX_FILE_SIZE = 100 * 1024; // 100KB
const MAX_TOTAL_CONTENT = 2 * 1024 * 1024; // 2MB

export interface ScannedFile {
  readonly path: string;
  readonly content: string;
  readonly lines: number;
  readonly isPriority: boolean;
}

export interface CodebaseSummary {
  readonly files: readonly ScannedFile[];
  readonly totalFiles: number;
  readonly totalLines: number;
  readonly fileTree: string;
}

interface GitignorePattern {
  readonly pattern: string;
  readonly negated: boolean;
  readonly regex: RegExp;
}

export async function scanCodebase(directory: string): Promise<CodebaseSummary> {
  const gitignorePatterns = await loadGitignore(directory);
  const filePaths = await collectFiles(directory, directory, gitignorePatterns);

  const priorityPaths = filePaths.filter((f) => PRIORITY_FILES.has(f.split('/').pop() ?? ''));
  const otherPaths = filePaths.filter((f) => !PRIORITY_FILES.has(f.split('/').pop() ?? ''));

  const orderedPaths = [...priorityPaths, ...otherPaths].slice(0, MAX_FILES);

  const scannedFiles: ScannedFile[] = [];
  let totalContent = 0;

  for (const filePath of orderedPaths) {
    if (totalContent >= MAX_TOTAL_CONTENT) break;

    const absolutePath = join(directory, filePath);
    const fileStat = await stat(absolutePath).catch(() => null);
    if (!fileStat || fileStat.size > MAX_FILE_SIZE) continue;

    const content = await readFile(absolutePath, 'utf-8').catch(() => null);
    if (content === null) continue;

    const isPriority = PRIORITY_FILES.has(filePath.split('/').pop() ?? '');
    const fileContent = isPriority ? content : extractSignatures(content, filePath);

    totalContent += fileContent.length;
    scannedFiles.push({
      path: filePath,
      content: fileContent,
      lines: content.split('\n').length,
      isPriority,
    });
  }

  const totalLines = scannedFiles.reduce((sum, f) => sum + f.lines, 0);
  const fileTree = buildFileTree(filePaths);

  return {
    files: scannedFiles,
    totalFiles: scannedFiles.length,
    totalLines,
    fileTree,
  };
}

async function collectFiles(
  baseDir: string,
  currentDir: string,
  gitignorePatterns: readonly GitignorePattern[],
): Promise<string[]> {
  const entries = await readdir(currentDir, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;

    const fullPath = join(currentDir, entry.name);
    const relativePath = relative(baseDir, fullPath);

    if (isGitignored(relativePath, entry.isDirectory(), gitignorePatterns)) continue;

    if (entry.isDirectory()) {
      const subFiles = await collectFiles(baseDir, fullPath, gitignorePatterns);
      files.push(...subFiles);
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(relativePath);
    } else if (entry.isFile() && PRIORITY_FILES.has(entry.name)) {
      files.push(relativePath);
    }

    if (files.length >= MAX_FILES) break;
  }

  return files;
}

async function loadGitignore(directory: string): Promise<readonly GitignorePattern[]> {
  const content = await readFile(join(directory, '.gitignore'), 'utf-8').catch(() => null);
  if (!content) return [];

  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map(parseGitignorePattern);
}

function parseGitignorePattern(pattern: string): GitignorePattern {
  const negated = pattern.startsWith('!');
  const cleanPattern = negated ? pattern.slice(1) : pattern;

  const regexStr = cleanPattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '<<GLOBSTAR>>')
    .replace(/\*/g, '[^/]*')
    .replace(/<<GLOBSTAR>>/g, '.*')
    .replace(/\?/g, '[^/]');

  const anchored = cleanPattern.includes('/') ? `^${regexStr}` : `(^|/)${regexStr}`;
  const withTrailing = cleanPattern.endsWith('/') ? anchored : `${anchored}($|/)`;

  return { pattern: cleanPattern, negated, regex: new RegExp(withTrailing) };
}

function isGitignored(
  relativePath: string,
  isDirectory: boolean,
  patterns: readonly GitignorePattern[],
): boolean {
  const testPath = isDirectory ? `${relativePath}/` : relativePath;
  let ignored = false;

  for (const pattern of patterns) {
    if (pattern.regex.test(testPath)) {
      ignored = !pattern.negated;
    }
  }

  return ignored;
}

function extractSignatures(content: string, filePath: string): string {
  const ext = extname(filePath);
  const lines = content.split('\n');

  if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    return lines
      .filter((line) => {
        const trimmed = line.trim();
        return (
          trimmed.startsWith('export ') ||
          trimmed.startsWith('import ') ||
          trimmed.startsWith('interface ') ||
          trimmed.startsWith('type ') ||
          trimmed.startsWith('class ') ||
          trimmed.startsWith('function ') ||
          trimmed.startsWith('const ') ||
          trimmed.startsWith('// ')
        );
      })
      .join('\n');
  }

  if (ext === '.py') {
    return lines
      .filter((line) => {
        const trimmed = line.trim();
        return (
          trimmed.startsWith('def ') ||
          trimmed.startsWith('class ') ||
          trimmed.startsWith('import ') ||
          trimmed.startsWith('from ') ||
          trimmed.startsWith('#')
        );
      })
      .join('\n');
  }

  // For other languages, return first 50 lines
  return lines.slice(0, 50).join('\n');
}

function buildFileTree(paths: readonly string[]): string {
  const tree: Record<string, string[]> = {};

  for (const filePath of paths) {
    const parts = filePath.split('/');
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';
    const file = parts[parts.length - 1] ?? '';

    if (!tree[dir]) tree[dir] = [];
    tree[dir]!.push(file);
  }

  const lines: string[] = [];
  const sortedDirs = Object.keys(tree).sort();

  for (const dir of sortedDirs) {
    lines.push(`${dir}/`);
    for (const file of tree[dir]!.sort()) {
      lines.push(`  ${file}`);
    }
  }

  return lines.join('\n');
}
