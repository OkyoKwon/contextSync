const XML_TAG_PATTERN = /<[a-z][a-z0-9-]*(?:\s[^>]*)?>[\s\S]*?<\/[a-z][a-z0-9-]*>/gi;
const SELF_CLOSING_TAG_PATTERN = /<[a-z][a-z0-9-]*(?:\s[^>]*)?\s*\/>/gi;
const SYSTEM_BRACKET_PATTERN = /\[Request interrupted[^\]]*\]/gi;

const PLAN_HEADER_PATTERN = /^#\s+(?:Plan:\s*)?(.+?)$/m;
const IMPLEMENT_PLAN_PREFIX = /^Implement the following plan:\s*/i;

const BOILERPLATE_PREFIXES: readonly RegExp[] = [
  /^Please\s+/i,
  /^Can you\s+/i,
  /^Could you\s+/i,
  /^I want you to\s+/i,
  /^I need you to\s+/i,
  /^I'd like you to\s+/i,
];

const MAX_TITLE_LENGTH = 100;

export const UNTITLED = 'Untitled Session';

// --- TitleContext interface and multi-signal title generation ---

export interface TitleContext {
  readonly userMessages: readonly string[];
  readonly assistantMessages: readonly string[];
  readonly branch?: string;
  readonly filePaths: readonly string[];
  readonly toolNames: readonly string[];
}

const VAGUE_SINGLE_WORDS = new Set([
  'yes',
  'y',
  'no',
  'n',
  'ok',
  'okay',
  'sure',
  'commit',
  'thanks',
  'thank',
  'hi',
  'hello',
  'hey',
  'help',
  'please',
  'lgtm',
  'ㅇㅇ',
  'ㅇㅋ',
  'ㄴㄴ',
  'ㅋㅋ',
  'ㅎㅎ',
  'ㄱㄱ',
]);

const VAGUE_SHORT_KO = new Set([
  '이거',
  '해줘',
  '고쳐',
  '확인',
  '수정',
  '변경',
  '삭제',
  '추가',
  '이것',
  '저거',
  '그거',
  '부탁',
  '해봐',
]);

const STACK_TRACE_PATTERN =
  /(?:^\s+at\s|^Error:|^TypeError:|^ReferenceError:|at Object\.<anonymous>)/m;

const ACTION_VERBS = new Set([
  'add',
  'fix',
  'refactor',
  'implement',
  'create',
  'update',
  'remove',
  'delete',
  'move',
  'rename',
  'replace',
  'migrate',
  'upgrade',
  'install',
  'configure',
  'setup',
  'build',
  'deploy',
  'test',
  'debug',
  'optimize',
  'extract',
  'split',
  'merge',
  'convert',
  'integrate',
  'enable',
  'disable',
  'write',
  'rewrite',
  'improve',
  'simplify',
  'clean',
  'cleanup',
]);

const BRANCH_PREFIXES = /^(?:feat|fix|refactor|chore|docs|test|hotfix|feature|bugfix)\//i;
const TICKET_PREFIX = /^[A-Z]+-\d+-/;
const TICKET_SUFFIX = /-[A-Z]+-\d+$/;
const DEFAULT_BRANCHES = new Set(['main', 'master', 'develop', 'development', 'dev', 'staging']);

const ASSISTANT_INTENT_PATTERNS: readonly RegExp[] = [
  /^I'll\s+(.+)/i,
  /^I will\s+(.+)/i,
  /^Let me\s+(.+)/i,
  /^I'm going to\s+(.+)/i,
  /^I am going to\s+(.+)/i,
];

const MODULE_PATH_PATTERNS: readonly RegExp[] = [
  /modules\/([^/]+)\//,
  /components\/([^/]+)\//,
  /src\/([^/]+)\//,
  /pages\/([^/]+)\//,
  /hooks\/([^/]+)\//,
];

export function isVagueMessage(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;

  // Stack trace detection
  if (STACK_TRACE_PATTERN.test(trimmed)) return true;

  const lower = trimmed.toLowerCase();
  const words = lower.split(/\s+/);

  // Single vague word
  if (words.length === 1 && VAGUE_SINGLE_WORDS.has(lower)) return true;

  // Short Korean vague patterns
  if (trimmed.length <= 6 && VAGUE_SHORT_KO.has(trimmed)) return true;

  // Very short message (< 15 chars) without action verbs
  if (trimmed.length < 15) {
    const hasVerb = words.some((w) => ACTION_VERBS.has(w));
    if (!hasVerb) return true;
  }

  return false;
}

export function scoreTitleCandidate(text: string): number {
  const cleaned = generateTitle(text);
  if (cleaned === UNTITLED) return -20;

  let score = 0;

  // Plan title extraction is high quality
  const strippedForPlan = text
    .replace(XML_TAG_PATTERN, '')
    .replace(SELF_CLOSING_TAG_PATTERN, '')
    .replace(SYSTEM_BRACKET_PATTERN, '')
    .trim();
  if (IMPLEMENT_PLAN_PREFIX.test(strippedForPlan) && PLAN_HEADER_PATTERN.test(strippedForPlan)) {
    score += 5;
  }

  // Vague message penalty
  if (isVagueMessage(cleaned)) {
    score -= 10;
    return score;
  }

  // Action verb bonus
  const words = cleaned.toLowerCase().split(/\s+/);
  if (words.some((w) => ACTION_VERBS.has(w))) {
    score += 3;
  }

  // Good length range
  if (cleaned.length >= 15 && cleaned.length <= 80) {
    score += 2;
  }

  // Long paste penalty
  if (text.length > 200) {
    score -= 2;
  }

  return score;
}

export function humanizeBranchName(branch: string): string | null {
  const trimmed = branch.trim();
  if (!trimmed) return null;

  // Ignore default branches
  if (DEFAULT_BRANCHES.has(trimmed.toLowerCase())) return null;

  let name = trimmed;

  // Remove prefix
  name = name.replace(BRANCH_PREFIXES, '');

  // Remove ticket numbers
  name = name.replace(TICKET_PREFIX, '');
  name = name.replace(TICKET_SUFFIX, '');

  // Convert separators to spaces
  name = name.replace(/[-_]/g, ' ').trim();

  if (!name) return null;

  // Capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function extractAssistantIntent(text: string): string | null {
  const firstLine = text.split(/[.\n]/)[0]?.trim();
  if (!firstLine) return null;

  for (const pattern of ASSISTANT_INTENT_PATTERNS) {
    const match = pattern.exec(firstLine);
    if (match?.[1]) {
      const intent = match[1].trim();
      if (!intent) continue;
      // Capitalize first letter, remove trailing punctuation
      const cleaned = intent.replace(/[.…]+$/, '').trim();
      if (!cleaned) continue;
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }

  return null;
}

export function summarizeFilePaths(paths: readonly string[]): string | null {
  if (paths.length === 0) return null;

  if (paths.length === 1) {
    const segments = paths[0]!.split('/');
    const last2 = segments.slice(-2).join('/');
    return last2;
  }

  // Extract module names
  const modules = new Set<string>();
  for (const p of paths) {
    for (const pattern of MODULE_PATH_PATTERNS) {
      const match = pattern.exec(p);
      if (match?.[1]) {
        modules.add(match[1]);
        break;
      }
    }
  }

  const moduleList = [...modules];

  if (moduleList.length === 1) {
    return `${paths.length} files in ${moduleList[0]}`;
  }

  if (moduleList.length >= 2) {
    const shown = moduleList.slice(0, 2).join(', ');
    return `${paths.length} files across ${shown}`;
  }

  // No module detected — just count
  return `${paths.length} files`;
}

export function generateSessionTitle(context: TitleContext): string {
  const { userMessages, assistantMessages, branch, filePaths } = context;

  // 1. Score user messages (up to first 5)
  const candidates = userMessages.slice(0, 5).map((msg) => ({
    text: msg,
    score: scoreTitleCandidate(msg),
  }));

  // Sort by score descending
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const bestCandidate = sorted[0];

  let title: string | undefined;

  // 2. Use best user message if it's not vague
  if (bestCandidate && bestCandidate.score > 0) {
    title = generateTitle(bestCandidate.text);
  }

  // 3. Try assistant intent if user messages are all vague
  if (!title && assistantMessages.length > 0) {
    for (const msg of assistantMessages) {
      const intent = extractAssistantIntent(msg);
      if (intent) {
        title =
          intent.length > MAX_TITLE_LENGTH
            ? intent.slice(0, MAX_TITLE_LENGTH).replace(/\s\S*$/, '')
            : intent;
        break;
      }
    }
  }

  // 4. Try humanized branch name
  if (!title && branch) {
    title = humanizeBranchName(branch) ?? undefined;
  }

  // 5. Final fallback
  if (!title) return UNTITLED;

  // 6. Add file path suffix if title is short and paths exist
  if (title.length < 60 && filePaths.length > 0) {
    const suffix = summarizeFilePaths(filePaths);
    if (suffix) {
      const withSuffix = `${title} (${suffix})`;
      if (withSuffix.length <= MAX_TITLE_LENGTH) {
        title = withSuffix;
      }
    }
  }

  return title;
}

// --- Existing functions (preserved as building blocks) ---

export function findFirstMeaningfulTitle(contents: readonly string[]): string {
  for (const content of contents) {
    const title = generateTitle(content);
    if (title !== UNTITLED) {
      return title;
    }
  }
  return UNTITLED;
}

export function stripSystemXmlContent(rawContent: string): string {
  let content = rawContent;
  content = content.replace(XML_TAG_PATTERN, '');
  content = content.replace(SELF_CLOSING_TAG_PATTERN, '');
  content = content.replace(SYSTEM_BRACKET_PATTERN, '');
  content = content.replace(/\s+/g, ' ').trim();
  return content;
}

export function generateTitle(rawContent: string): string {
  // 1. Strip XML tags and system bracket messages (preserve newlines for plan header detection)
  let content = rawContent;
  content = content.replace(XML_TAG_PATTERN, '');
  content = content.replace(SELF_CLOSING_TAG_PATTERN, '');
  content = content.replace(SYSTEM_BRACKET_PATTERN, '');
  content = content.trim();

  // 2. Try to extract plan name from markdown header (needs newlines intact)
  const planMatch = IMPLEMENT_PLAN_PREFIX.test(content) ? PLAN_HEADER_PATTERN.exec(content) : null;

  if (planMatch) {
    content = planMatch[1]!.trim();
  } else {
    // 3. Strip "Implement the following plan:" prefix
    content = content.replace(IMPLEMENT_PLAN_PREFIX, '');

    // 4. Strip markdown header prefixes (e.g. "# Title", "## Title")
    content = content.replace(/^#{1,6}\s+/gm, '');

    // 5. Strip boilerplate prefixes
    for (const prefix of BOILERPLATE_PREFIXES) {
      content = content.replace(prefix, '');
    }
  }

  // 6. Clean whitespace — collapse multiple spaces/newlines into single space
  content = content.replace(/\s+/g, ' ').trim();

  // 7. Fallback for empty content
  if (!content) {
    return 'Untitled Session';
  }

  // 8. Truncate smartly at word boundary
  if (content.length > MAX_TITLE_LENGTH) {
    const truncated = content.slice(0, MAX_TITLE_LENGTH);
    const lastSpace = truncated.lastIndexOf(' ');
    content = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  }

  return content;
}
